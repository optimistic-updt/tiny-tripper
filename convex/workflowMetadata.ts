import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Create a workflow metadata record to track progress and files
 */
export const createWorkflowRecord = internalMutation({
  args: {
    workflowId: v.string(),
    url: v.string(),
    config: v.object({
      maxDepth: v.optional(v.number()),
      maxPages: v.optional(v.number()),
      maxExtractions: v.optional(v.number()),
      autoImport: v.optional(v.boolean()),
      urgencyDefault: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      ),
      tagsHint: v.optional(v.array(v.string())),
      useMockScrape: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const workflowRecordId = await ctx.db.insert("scrapeWorkflows", {
      workflowId: args.workflowId,
      url: args.url,
      status: "running",
      startedAt: new Date().toISOString(),
      config: args.config,
      files: {},
    });

    console.log(
      `Created workflow record: ${workflowRecordId} for workflow ${args.workflowId}`,
    );

    return workflowRecordId;
  },
});

/**
 * Update workflow record with a storage file ID
 */
export const updateWorkflowFile = internalMutation({
  args: {
    workflowId: v.string(),
    fileType: v.union(
      v.literal("rawActivities"),
      v.literal("imagesMap"),
      v.literal("geocodedMap"),
      v.literal("embeddingsMap"),
      v.literal("mergedActivities"),
      v.literal("finalJsonl"),
    ),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("scrapeWorkflows")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .first();

    if (!record) {
      throw new Error(`Workflow record not found: ${args.workflowId}`);
    }

    await ctx.db.patch(record._id, {
      files: {
        ...record.files,
        [args.fileType]: args.storageId,
      },
    });

    console.log(
      `Updated workflow ${args.workflowId} with ${args.fileType}: ${args.storageId}`,
    );
  },
});

/**
 * Mark workflow as completed with results
 */
export const completeWorkflow = internalMutation({
  args: {
    workflowId: v.string(),
    activitiesProcessed: v.number(),
    importSummary: v.optional(
      v.object({
        imported: v.number(),
        skipped: v.number(),
        failed: v.number(),
        errors: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("scrapeWorkflows")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .first();

    if (!record) {
      throw new Error(`Workflow record not found: ${args.workflowId}`);
    }

    await ctx.db.patch(record._id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      activitiesProcessed: args.activitiesProcessed,
      importSummary: args.importSummary,
    });

    console.log(`Marked workflow ${args.workflowId} as completed`);
  },
});

/**
 * Mark workflow as failed
 */
export const failWorkflow = internalMutation({
  args: {
    workflowId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("scrapeWorkflows")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .first();

    if (!record) {
      throw new Error(`Workflow record not found: ${args.workflowId}`);
    }

    await ctx.db.patch(record._id, {
      status: "failed",
      completedAt: new Date().toISOString(),
    });

    console.log(`Marked workflow ${args.workflowId} as failed: ${args.error}`);
  },
});

/**
 * Get workflow record by workflowId
 */
export const getWorkflowRecord = internalMutation({
  args: {
    workflowId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scrapeWorkflows")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .first();
  },
});

/**
 * Clean up storage files for a completed workflow
 */
export const cleanupWorkflowFiles = internalAction({
  args: {
    workflowId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get workflow record - we need to create a separate query for this
    const getRecordMutation = internal.workflowMetadata.getWorkflowRecord;
    
    const record = await ctx.runMutation(getRecordMutation, {
      workflowId: args.workflowId,
    });

    if (!record) {
      console.warn(`Workflow record not found: ${args.workflowId}`);
      return;
    }

    // Delete all storage files
    const filesToDelete: Id<"_storage">[] = [
      record.files.rawActivities,
      record.files.imagesMap,
      record.files.geocodedMap,
      record.files.embeddingsMap,
      record.files.mergedActivities,
      record.files.finalJsonl,
    ].filter((id): id is Id<"_storage"> => id !== undefined);

    console.log(
      `Cleaning up ${filesToDelete.length} storage files for workflow ${args.workflowId}`,
    );

    for (const storageId of filesToDelete) {
      try {
        await ctx.storage.delete(storageId);
        console.log(`Deleted storage file: ${storageId}`);
      } catch (error) {
        console.warn(`Failed to delete storage file ${storageId}:`, error);
      }
    }

    console.log(`Cleanup complete for workflow ${args.workflowId}`);
  },
});
