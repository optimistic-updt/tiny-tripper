import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

interface ImportSummary {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Bulk import activities into the database with deduplication
 * Detects duplicates by matching name and formattedAddress
 */
export const bulkImportActivities = internalMutation({
  args: {
    activities: v.array(v.any()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<ImportSummary> => {
    const activities = args.activities as Omit<
      Doc<"activities">,
      "_id" | "_creationTime"
    >[];

    const summary: ImportSummary = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    console.log(`Starting bulk import of ${activities.length} activities`);

    for (const activity of activities) {
      try {
        // Check for duplicate (name + location match)
        const existing = await ctx.db
          .query("activities")
          .filter((q) => q.eq(q.field("name"), activity.name))
          .first();

        if (
          existing &&
          existing.location?.formattedAddress ===
            activity.location?.formattedAddress
        ) {
          console.log(
            `Skipping duplicate activity: ${activity.name} at ${activity.location?.formattedAddress}`,
          );
          summary.skipped++;
          continue;
        }

        // Import using createActivityDocument
        await ctx.runMutation(internal.activities.createActivityDocument, {
          name: activity.name,
          description: activity.description,
          urgency: activity.urgency,
          location: activity.location,
          startDate: activity.startDate,
          endDate: activity.endDate,
          isPublic: activity.isPublic,
          tags: activity.tags,
          embedding: activity.embedding,
          imageId: activity.imageId,
        });

        console.log(`Successfully imported activity: ${activity.name}`);
        summary.imported++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Failed to import activity ${activity.name}:`, error);
        summary.failed++;
        summary.errors.push(
          `Failed to import ${activity.name}: ${errorMessage}`,
        );
      }
    }

    console.log(
      `Import complete: ${summary.imported} imported, ${summary.skipped} skipped, ${summary.failed} failed`,
    );

    return summary;
  },
});

/**
 * Generate JSON-L formatted output from activities
 * Returns a string with one JSON object per line
 */
export const generateJsonL = internalMutation({
  args: {
    activities: v.array(v.any()),
  },
  handler: async (_ctx, args): Promise<string> => {
    const activities = args.activities as Omit<
      Doc<"activities">,
      "_id" | "_creationTime"
    >[];

    if (activities.length === 0) {
      return "";
    }

    // Convert each activity to a JSON line
    const jsonLines = activities.map((activity) => JSON.stringify(activity));

    // Join with newlines
    return jsonLines.join("\n");
  },
});

/**
 * Store JSONL content to Convex storage
 * Returns the storage ID of the uploaded file
 */
export const storeJsonL = internalAction({
  args: {
    jsonlContent: v.string(),
    runId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ storageId: string; filename: string }> => {
    // Create a blob from the JSONL content
    const blob = new Blob([args.jsonlContent], { type: "application/jsonl" });

    // Generate filename with run ID
    const filename = `scrape-${args.runId}.jsonl`;

    // Store the file
    const storageId = await ctx.storage.store(blob);

    console.log(`Stored JSONL file: ${filename} (Storage ID: ${storageId})`);

    return { storageId, filename };
  },
});
