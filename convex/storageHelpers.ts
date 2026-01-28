import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Store JSON data to Convex storage
 * Returns the storage ID
 */
export const storeJsonData = internalAction({
  args: {
    data: v.any(),
    filename: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    const jsonString = JSON.stringify(args.data);
    const blob = new Blob([jsonString], { type: "application/json" });
    const storageId = await ctx.storage.store(blob);

    console.log(
      `Stored JSON data to ${args.filename} (Storage ID: ${storageId})`,
    );

    return storageId;
  },
});

/**
 * Retrieve JSON data from Convex storage
 */
export const retrieveJsonData = internalAction({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<unknown> => {
    const blob = await ctx.storage.get(args.storageId);

    if (!blob) {
      throw new Error(`Storage file not found: ${args.storageId}`);
    }

    const text = await blob.text();
    const data = JSON.parse(text);

    console.log(`Retrieved JSON data from storage: ${args.storageId}`);

    return data;
  },
});
