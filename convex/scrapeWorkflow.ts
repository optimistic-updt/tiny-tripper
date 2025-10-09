import { WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";
import type { RawActivity } from "./scraping";
import type { StandardizedActivity } from "./formatting";
import type { Doc } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

const workflow = new WorkflowManager(components.workflow);

interface ImportSummary {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Website Scraping ETL Pipeline Workflow
 *
 * Orchestrates the entire pipeline:
 * 1. Scrape website for activity data
 * 2. Standardize and format data
 * 3. Process images, geocode addresses, generate embeddings (parallel)
 * 4. Poll embedding batch until complete (with durable sleep)
 * 5. Merge all data
 * 6. Import to database or generate JSON-L file
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
        isPublic: v.optional(v.boolean()),
        tagsHint: v.optional(v.array(v.string())),
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
    importSummary?: ImportSummary;
    jsonlContent?: string;
  }> => {
    // Apply config defaults
    const config = {
      maxDepth: args.config?.maxDepth,
      maxPages: args.config?.maxPages || 150,
      maxExtractions: args.config?.maxExtractions || 150,
      autoImport: args.config?.autoImport ?? false,
      urgencyDefault: args.config?.urgencyDefault || "medium",
      isPublic: args.config?.isPublic ?? true,
      tagsHint: args.config?.tagsHint || undefined,
    };

    console.log(`Starting scrape workflow for URL: ${args.url}`);
    console.log(`Config:`, config);

    // Step 1: Scrape website
    const rawActivities: RawActivity[] = await step.runAction(
      internal.scraping.scrapeWebsite,
      {
        url: args.url,
        maxDepth: config.maxDepth,
        maxPages: config.maxPages,
        maxExtractions: config.maxExtractions,
        tagsHint: config.tagsHint,
      },
      { name: "scrape-website" },
    );

    console.log(`Scraped ${rawActivities.length} raw activities`);

    if (rawActivities.length === 0) {
      console.log("No activities found, workflow complete");
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
    console.log("Starting parallel processing: images, geocoding, embeddings");

    const [imagesMap, geocodedMap, embeddingBatchId]: [
      Record<number, string>,
      Record<
        number,
        {
          latitude: number;
          longitude: number;
          placeId: string;
          formattedAddress: string;
        }
      >,
      string,
    ] = await Promise.all([
      // 3a: Process images
      step.runAction(
        internal.imageProcessing.processImages,
        { activities: standardizedActivities },
        { name: "process-images" },
      ),

      // 3b: Geocode addresses
      step.runAction(
        internal.geocoding.geocodeAddresses,
        { activities: standardizedActivities },
        { name: "geocode-addresses" },
      ),

      // 3c: Submit embedding batch
      step.runAction(
        internal.embeddings.submitEmbeddingBatch,
        { activities: standardizedActivities },
        { name: "submit-embeddings" },
      ),
    ]);

    console.log(
      `Parallel processing complete. Images: ${Object.keys(imagesMap).length}, Geocoded: ${Object.keys(geocodedMap).length}, Batch ID: ${embeddingBatchId}`,
    );

    // Step 3d: Poll embedding batch until complete
    console.log(`Polling embedding batch: ${embeddingBatchId}`);

    const embeddingsMap: Record<number, number[]> = await step.runAction(
      internal.embeddings.pollEmbeddingBatchUntilComplete,
      {
        batchId: embeddingBatchId,
        maxAttempts: 120, // 2 hours max (120 attempts × 1 minute)
        delayMs: 60 * 1000, // 1 minute between polls
      },
      { name: "poll-embeddings-until-complete" },
    );

    console.log(
      `Embeddings ready: ${Object.keys(embeddingsMap).length} embeddings generated`,
    );

    // Step 4: Merge all data
    const mergedActivities: Array<
      Omit<Doc<"activities">, "_id" | "_creationTime">
    > = await step.runMutation(
      internal.formatting.mergeActivityData,
      {
        activities: standardizedActivities,
        images: imagesMap,
        geocoded: geocodedMap,
        embeddings: embeddingsMap,
      },
      { name: "merge-activity-data" },
    );

    console.log(`Merged ${mergedActivities.length} complete activities`);

    // Step 5: Import to database or generate JSON-L file
    if (config.autoImport) {
      console.log("Auto-import enabled, importing to database");

      const importSummary: ImportSummary = await step.runMutation(
        internal.importing.bulkImportActivities,
        { activities: mergedActivities },
        { name: "bulk-import-activities" },
      );

      console.log(
        `Import complete: ${importSummary.imported} imported, ${importSummary.skipped} skipped, ${importSummary.failed} failed`,
      );

      return {
        success: true,
        activitiesProcessed: mergedActivities.length,
        importSummary,
      };
    } else {
      console.log("Auto-import disabled, generating JSON-L file");

      const jsonlContent: string = await step.runMutation(
        internal.importing.generateJsonL,
        { activities: mergedActivities },
        { name: "generate-jsonl" },
      );

      console.log(
        `Generated JSON-L file with ${mergedActivities.length} activities`,
      );

      return {
        success: true,
        activitiesProcessed: mergedActivities.length,
        jsonlContent,
      };
    }
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
        isPublic: v.optional(v.boolean()),
        tagsHint: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await workflow.start(
      ctx,
      internal.scrapeWorkflow.websiteScrapeWorkflow,
      args,
    );
  },
});
