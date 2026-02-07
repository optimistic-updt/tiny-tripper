"use node";

import sharp from "sharp";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import type { StandardizedActivity } from "./formatting";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;
const WEBP_QUALITY = 82;

/**
 * Compress an image blob to WebP at 1200x630 max dimensions
 */
async function compressImageBlob(blob: Blob): Promise<Blob> {
  const buffer = Buffer.from(await blob.arrayBuffer());

  const compressed = await sharp(buffer)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return new Blob([new Uint8Array(compressed)], { type: "image/webp" });
}

/**
 * Download an image from a URL and return the blob
 */
async function downloadImage(url: string): Promise<Blob> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download image: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith("image/")) {
    throw new Error(`URL does not point to an image: ${contentType}`);
  }

  return await response.blob();
}

/**
 * Process images for activities: download from URLs and upload to Convex storage
 * Returns a map of activity index to storage ID
 */
export const processImages = internalAction({
  args: {
    activities: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const activities = args.activities as StandardizedActivity[];
    const imageMap: Record<number, string> = {};

    console.log(`Processing images for ${activities.length} activities`);

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];

      // Skip if no image URL
      if (!activity.imageURL) {
        continue;
      }

      try {
        console.log(`Downloading image for activity ${i}: ${activity.name}`);
        const imageBlob = await downloadImage(activity.imageURL);

        const compressed = await compressImageBlob(imageBlob);
        console.log(
          `Compressed: ${imageBlob.size} bytes → ${compressed.size} bytes (${Math.round((1 - compressed.size / imageBlob.size) * 100)}% reduction)`,
        );
        const storageId = await ctx.storage.store(compressed);

        imageMap[i] = storageId;
        console.log(
          `Successfully stored image for activity ${i}: ${storageId}`,
        );
      } catch (error) {
        // Log error but don't fail the entire pipeline
        console.error(
          `Failed to process image for activity ${i} (${activity.name}):`,
          error,
        );
        console.error(`Image URL was: ${activity.imageURL}`);
        // Continue processing other images
      }
    }

    console.log(
      `Image processing complete. Successfully processed ${Object.keys(imageMap).length} of ${activities.length} activities`,
    );

    return imageMap;
  },
});

/**
 * Process images and store the result map in storage
 * Returns the storage ID of the stored image map
 */
export const processImagesAndStore = internalAction({
  args: {
    activities: v.array(v.any()),
    workflowId: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    // Process images
    const imageMap = await ctx.runAction(internal.imageProcessing.processImages, {
      activities: args.activities,
    });

    // Store the map in storage
    const storageId = await ctx.runAction(internal.storageHelpers.storeJsonData, {
      data: imageMap,
      filename: `workflow-${args.workflowId}-images.json`,
    });

    return storageId;
  },
});
