import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import type { StandardizedActivity } from "./formatting";

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

        console.log(
          `Uploading image to storage (${imageBlob.size} bytes, ${imageBlob.type})`,
        );
        const storageId = await ctx.storage.store(imageBlob);

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
