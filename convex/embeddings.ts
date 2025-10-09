import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { StandardizedActivity } from "./formatting";
import { env } from "./env";
import OpenAI from "openai";

interface BatchRequest {
  custom_id: string;
  method: string;
  url: string;
  body: {
    model: string;
    input: string;
    encoding_format: string;
  };
}

interface BatchResponse {
  custom_id: string;
  response: {
    status_code: number;
    body: {
      data: Array<{
        embedding: number[];
      }>;
    };
  };
}

/**
 * Create embedding input text from activity data
 */
function createEmbeddingText(activity: StandardizedActivity): string {
  const parts: string[] = [activity.name];

  if (activity.description) {
    parts.push(activity.description);
  }

  if (activity.location?.formattedAddress) {
    parts.push(activity.location.formattedAddress);
  }

  if (activity.tags && activity.tags.length > 0) {
    parts.push(activity.tags.join(", "));
  }

  return parts.join(" | ");
}

/**
 * Submit a batch job to OpenAI for embedding generation
 * Returns the batch ID for polling
 */
export const submitEmbeddingBatch = internalAction({
  args: {
    activities: v.array(v.any()),
  },
  handler: async (_ctx, args): Promise<string> => {
    const activities = args.activities as StandardizedActivity[];
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    console.log(
      `Preparing batch embedding requests for ${activities.length} activities`,
    );

    // Prepare batch requests
    const batchRequests: BatchRequest[] = activities.map((activity, i) => ({
      custom_id: `request-${i}`,
      method: "POST",
      url: "/v1/embeddings",
      body: {
        model: "text-embedding-3-small",
        input: createEmbeddingText(activity),
        encoding_format: "float",
      },
    }));

    // Convert to JSONL format
    const jsonlContent = batchRequests
      .map((req) => JSON.stringify(req))
      .join("\n");

    // Upload batch file
    console.log("Uploading batch file to OpenAI");
    const file = await openai.files.create({
      file: new File([jsonlContent], "batch_input.jsonl", {
        type: "application/jsonl",
      }),
      purpose: "batch",
    });

    console.log(`Batch file uploaded: ${file.id}`);

    // Create batch job
    const batch = await openai.batches.create({
      input_file_id: file.id,
      endpoint: "/v1/embeddings",
      completion_window: "24h",
    });

    console.log(`Batch job submitted: ${batch.id}`);

    return batch.id;
  },
});

/**
 * Poll a batch job and retrieve embeddings if completed
 * Returns null if batch is still in progress, or a map of activity index to embedding vector
 */
export const pollEmbeddingBatch = internalAction({
  args: {
    batchId: v.string(),
  },
  handler: async (_ctx, args): Promise<Record<number, number[]> | null> => {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    console.log(`Polling batch job: ${args.batchId}`);

    // Get batch status
    const batch = await openai.batches.retrieve(args.batchId);

    console.log(`Batch status: ${batch.status}`);

    // If not completed, return null
    if (batch.status !== "completed") {
      if (
        batch.status === "failed" ||
        batch.status === "expired" ||
        batch.status === "cancelled"
      ) {
        throw new Error(`Batch job failed with status: ${batch.status}`);
      }
      return null;
    }

    // Batch is completed, retrieve results
    if (!batch.output_file_id) {
      throw new Error("Batch completed but no output file ID");
    }

    console.log(`Retrieving batch results from file: ${batch.output_file_id}`);

    // Download results file
    const fileContent = await openai.files.content(batch.output_file_id);
    const fileText = await fileContent.text();

    // Parse JSONL responses
    const responses = fileText
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as BatchResponse);

    console.log(`Parsed ${responses.length} embedding responses`);

    // Build embedding map
    const embeddingMap: Record<number, number[]> = {};

    for (const response of responses) {
      // Extract index from custom_id (format: "request-{index}")
      const match = response.custom_id.match(/^request-(\d+)$/);
      if (!match) {
        console.warn(`Invalid custom_id format: ${response.custom_id}`);
        continue;
      }

      const index = parseInt(match[1], 10);

      // Check for successful response
      if (response.response.status_code !== 200) {
        console.warn(
          `Embedding request ${index} failed with status: ${response.response.status_code}`,
        );
        continue;
      }

      // Extract embedding vector
      const embedding = response.response.body.data[0]?.embedding;
      if (!embedding) {
        console.warn(`No embedding data for request ${index}`);
        continue;
      }

      embeddingMap[index] = embedding;
    }

    console.log(
      `Successfully retrieved ${Object.keys(embeddingMap).length} embeddings`,
    );

    return embeddingMap;
  },
});

/**
 * Poll a batch job until complete, with automatic retries
 * This runs outside the workflow to handle polling delays using setTimeout
 */
export const pollEmbeddingBatchUntilComplete = internalAction({
  args: {
    batchId: v.string(),
    maxAttempts: v.optional(v.number()),
    delayMs: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<Record<number, number[]>> => {
    const maxAttempts = args.maxAttempts ?? 120;
    const delayMs = args.delayMs ?? 60 * 1000;

    console.log(
      `Starting polling for batch ${args.batchId} (max ${maxAttempts} attempts, ${delayMs}ms delay)`,
    );

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await ctx.runAction(internal.embeddings.pollEmbeddingBatch, {
        batchId: args.batchId,
      });

      if (result !== null) {
        console.log(
          `Batch complete after ${attempt + 1} attempts: ${Object.keys(result).length} embeddings`,
        );
        return result;
      }

      console.log(
        `Batch not ready (attempt ${attempt + 1}/${maxAttempts}), waiting ${delayMs}ms...`,
      );

      // Wait before next poll (only if not the last attempt)
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Timed out - return empty map
    console.warn(
      `Batch ${args.batchId} timed out after ${maxAttempts} attempts. Returning empty embeddings.`,
    );
    return {};
  },
});
