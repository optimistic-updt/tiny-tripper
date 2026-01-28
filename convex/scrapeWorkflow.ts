import { WorkflowManager, vWorkflowId } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";
import type { RawActivity } from "./scraping";
import type { StandardizedActivity } from "./formatting";
import type { Id } from "./_generated/dataModel";
import { mutation, internalMutation } from "./_generated/server";

const workflow = new WorkflowManager(components.workflow);

interface ImportSummary {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// TODO - key files:
// - scraping.ts - scrape website, return raw activities
// the batch embeddings
// the final jsonl
// ---
// the geocode map
// the image map

// TODO
// Steps can only take in and return a total of 1 MiB of data within a single workflow execution. If you run into journal size limits, you can work around this by storing results in the DB from your step functions and passing IDs around within the the workflow.
// the batch embeddings can return much more than 1 MiB of data if there are many activities
// the final jsonl can be much more than 1 MiB of data if there are many activities
// so we should store those in the DB and pass around IDs
// www.convex.dev/components/workflow#limitations
// also doc can't be more than 1mb
//docs.convex.dev/production/state/limits#documents

/**
 * Website Scraping ETL Pipeline Workflow
 *
 * Orchestrates the entire pipeline:
 * 1. Create workflow metadata record
 * 2. Scrape website for activity data and store in storage
 * 3. Standardize and format data
 * 4. Process images, geocode addresses, generate embeddings (parallel) - all stored in storage
 * 5. Poll embedding batch until complete (with durable sleep) - stored in storage
 * 6. Merge all data from storage
 * 7. Generate and store JSONL file
 * 8. Conditionally import to database if autoImport is enabled
 * 9. Update workflow metadata with results
 */
export const websiteScrapeWorkflow = workflow.define({
  args: {
    url: v.string(),
    config: v.optional(
      v.object({
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
    ),
  },
  handler: async (
    step,
    args,
  ): Promise<{
    success: boolean;
    activitiesProcessed: number;
    message?: string;
    storageId?: Id<"_storage">;
    filename?: string;
    importSummary?: ImportSummary;
  }> => {
    // Apply config defaults
    const config = {
      maxDepth: args.config?.maxDepth,
      maxPages: args.config?.maxPages || 150,
      maxExtractions: args.config?.maxExtractions || 150,
      autoImport: args.config?.autoImport ?? false,
      urgencyDefault: args.config?.urgencyDefault || "medium",
      isPublic: true,
      tagsHint: args.config?.tagsHint || undefined,
      useMockScrape: args.config?.useMockScrape ?? false,
    };

    const workflowId = step.workflowId;

    console.log(`Starting scrape workflow ${workflowId} for URL: ${args.url}`);
    console.log(`Config:`, config);

    // Step 0: Create workflow metadata record
    await step.runMutation(
      internal.workflowMetadata.createWorkflowRecord,
      {
        workflowId,
        url: args.url,
        config: args.config || {},
      },
      { name: "create-workflow-record" },
    );

    // Step 1: Scrape website and store raw activities
    const rawActivitiesStorageId: Id<"_storage"> = await step.runAction(
      internal.scraping.scrapeWebsiteAndStore,
      {
        url: args.url,
        maxDepth: config.maxDepth,
        maxPages: config.maxPages,
        maxExtractions: config.maxExtractions,
        tagsHint: config.tagsHint,
        useMockScrape: config.useMockScrape,
        workflowId,
      },
      { name: "scrape-website-and-store" },
    );

    // Update workflow record with raw activities storage ID
    await step.runMutation(
      internal.workflowMetadata.updateWorkflowFile,
      {
        workflowId,
        fileType: "rawActivities",
        storageId: rawActivitiesStorageId,
      },
      { name: "update-raw-activities-storage" },
    );

    // Retrieve raw activities from storage for processing
    const rawActivitiesData = await step.runAction(
      internal.storageHelpers.retrieveJsonData,
      { storageId: rawActivitiesStorageId },
      { name: "retrieve-raw-activities" },
    );

    const rawActivities = rawActivitiesData as RawActivity[];

    console.log(`Scraped ${rawActivities.length} raw activities`);

    if (rawActivities.length === 0) {
      console.log("No activities found, workflow complete");
      
      await step.runMutation(
        internal.workflowMetadata.completeWorkflow,
        {
          workflowId,
          activitiesProcessed: 0,
        },
        { name: "mark-workflow-complete" },
      );

      return {
        success: true,
        activitiesProcessed: 0,
        message: "No activities found on the website",
      };
    }

    // Step 2: Standardize data
    const standardizedActivities: StandardizedActivity[] =
      await step.runMutation(
        internal.formatting.standardizeActivities,
        {
          rawActivities,
          config: {
            urgencyDefault: config.urgencyDefault,
            isPublic: config.isPublic,
          },
        },
        { name: "standardize-activities" },
      );

    console.log(`Standardized ${standardizedActivities.length} activities`);

    // Step 3: Parallel processing (images, geocoding, embeddings)
    // All results stored in storage, returns storage IDs
    console.log("Starting parallel processing: images, geocoding, embeddings");

    const [imagesStorageId, geocodedStorageId, embeddingBatchId]: [
      Id<"_storage">,
      Id<"_storage">,
      string,
    ] = await Promise.all([
      // 3a: Process images and store
      step.runAction(
        internal.imageProcessing.processImagesAndStore,
        { activities: standardizedActivities, workflowId },
        { name: "process-images-and-store" },
      ),

      // 3b: Geocode addresses and store
      step.runAction(
        internal.geocoding.geocodeAddressesAndStore,
        { activities: standardizedActivities, workflowId },
        { name: "geocode-addresses-and-store" },
      ),

      // 3c: Submit embedding batch
      step.runAction(
        internal.embeddings.submitEmbeddingBatch,
        { activities: standardizedActivities },
        { name: "submit-embeddings" },
      ),
    ]);

    // Update workflow record with intermediate storage IDs
    await Promise.all([
      step.runMutation(
        internal.workflowMetadata.updateWorkflowFile,
        {
          workflowId,
          fileType: "imagesMap",
          storageId: imagesStorageId,
        },
        { name: "update-images-storage" },
      ),
      step.runMutation(
        internal.workflowMetadata.updateWorkflowFile,
        {
          workflowId,
          fileType: "geocodedMap",
          storageId: geocodedStorageId,
        },
        { name: "update-geocoded-storage" },
      ),
    ]);

    console.log(
      `Parallel processing complete. Batch ID: ${embeddingBatchId}`,
    );

    // Step 3d: Poll embedding batch until complete and store
    console.log(`Polling embedding batch: ${embeddingBatchId}`);

    const embeddingsStorageId: Id<"_storage"> = await step.runAction(
      internal.embeddings.pollEmbeddingBatchAndStore,
      {
        batchId: embeddingBatchId,
        workflowId,
      },
      {
        name: "poll-embeddings-and-store",
        retry: {
          maxAttempts: 150,
          initialBackoffMs: 60000,
          base: 1.5,
        },
      },
    );

    // Update workflow record with embeddings storage ID
    await step.runMutation(
      internal.workflowMetadata.updateWorkflowFile,
      {
        workflowId,
        fileType: "embeddingsMap",
        storageId: embeddingsStorageId,
      },
      { name: "update-embeddings-storage" },
    );

    console.log(`Embeddings ready and stored`);

    // Step 4: Merge all data from storage and store result
    const mergeResult: { storageId: Id<"_storage">; count: number } =
      await step.runAction(
        internal.formatting.mergeActivityDataAndStore,
        {
          activities: standardizedActivities,
          imagesStorageId,
          geocodedStorageId,
          embeddingsStorageId,
          workflowId,
        },
        { name: "merge-and-store-activity-data" },
      );

    const mergedActivitiesStorageId = mergeResult.storageId;
    const activitiesCount = mergeResult.count;

    console.log(`Merged ${activitiesCount} complete activities`);

    // Update workflow record with merged activities storage ID
    await step.runMutation(
      internal.workflowMetadata.updateWorkflowFile,
      {
        workflowId,
        fileType: "mergedActivities",
        storageId: mergedActivitiesStorageId,
      },
      { name: "update-merged-activities-storage" },
    );

    // Step 5a: Generate a unique run ID for this scrape
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const urlSlug = args.url
      .replace(/^https?:\/\//, "")
      .replace(/[^a-z0-9]/gi, "-")
      .slice(0, 30);
    const runId = `${timestamp}-${urlSlug}`;

    // Step 5b: Generate and store JSONL file directly
    console.log("Generating and storing JSONL file");

    const { storageId, filename }: { storageId: Id<"_storage">; filename: string } =
      await step.runAction(
        internal.importing.generateAndStoreJsonL,
        { mergedActivitiesStorageId, runId },
        { name: "generate-and-store-jsonl" },
      );

    // Update workflow record with final JSONL storage ID
    await step.runMutation(
      internal.workflowMetadata.updateWorkflowFile,
      {
        workflowId,
        fileType: "finalJsonl",
        storageId,
      },
      { name: "update-jsonl-storage" },
    );

    console.log(`Stored JSONL file: ${filename} (Storage ID: ${storageId})`);

    // Step 5d: Conditionally import to database if autoImport is enabled
    let importSummary: ImportSummary | undefined;

    if (config.autoImport) {
      console.log("Auto-import enabled, importing to database");

      importSummary = await step.runAction(
        internal.importing.bulkImportActivitiesFromStorage,
        { mergedActivitiesStorageId },
        { name: "bulk-import-from-storage" },
      );

      if (importSummary) {
        console.log(
          `Import complete: ${importSummary.imported} imported, ${importSummary.skipped} skipped, ${importSummary.failed} failed`,
        );
      }
    } else {
      console.log("Auto-import disabled, JSONL file stored for review");
    }

    // Step 6: Mark workflow as complete
    await step.runMutation(
      internal.workflowMetadata.completeWorkflow,
      {
        workflowId,
        activitiesProcessed: activitiesCount,
        importSummary,
      },
      { name: "mark-workflow-complete" },
    );

    return {
      success: true,
      activitiesProcessed: activitiesCount,
      storageId,
      filename,
      importSummary,
    };
  },
});

export const startWebsiteScrapeWorkflow = mutation({
  args: {
    url: v.string(),
    config: v.optional(
      v.object({
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
    ),
  },
  handler: async (ctx, args): Promise<string> => {
    const workflowId: string = await workflow.start(
      ctx,
      internal.scrapeWorkflow.websiteScrapeWorkflow,
      args,
      {
        onComplete: internal.scrapeWorkflow.handleWorkflowComplete,
        context: { autoImport: args.config?.autoImport ?? false },
      },
    );

    return workflowId;
  },
});

/**
 * Handle workflow completion - cleanup files if autoImport is true
 */
export const handleWorkflowComplete = internalMutation({
  args: {
    workflowId: vWorkflowId,
    result: v.any(), // RunResult type from workpool
    context: v.any(), // Our custom context
  },
  handler: async (ctx, args) => {
    console.log(
      `Workflow ${args.workflowId} completed with status: ${args.result.kind}`,
    );

    // Extract our context
    const context = args.context as { autoImport: boolean };

    if (args.result.kind === "success") {
      // If autoImport is true and workflow succeeded, clean up storage files
      if (context.autoImport) {
        console.log(
          `Auto-import was enabled, scheduling cleanup for workflow ${args.workflowId}`,
        );

        await ctx.scheduler.runAfter(
          0,
          internal.workflowMetadata.cleanupWorkflowFiles,
          { workflowId: args.workflowId as string },
        );
      } else {
        console.log(
          `Auto-import was disabled, keeping storage files for workflow ${args.workflowId}`,
        );
      }
    } else if (args.result.kind === "error") {
      console.error(
        `Workflow ${args.workflowId} failed with error: ${args.result.error}`,
      );

      // Mark workflow as failed
      await ctx.scheduler.runAfter(
        0,
        internal.workflowMetadata.failWorkflow,
        {
          workflowId: args.workflowId as string,
          error: args.result.error || "Unknown error",
        },
      );
    } else if (args.result.kind === "canceled") {
      console.log(`Workflow ${args.workflowId} was canceled`);

      // Mark workflow as failed
      await ctx.scheduler.runAfter(
        0,
        internal.workflowMetadata.failWorkflow,
        {
          workflowId: args.workflowId as string,
          error: "Workflow canceled",
        },
      );
    }
  },
});
