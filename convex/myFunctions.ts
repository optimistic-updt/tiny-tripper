import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Example functions - these were referenced in error logs
export const listNumbers = query({
  args: {
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Return some example data
    return Array.from({ length: args.count || 5 }, (_, i) => ({
      id: i,
      value: Math.floor(Math.random() * 100),
    }));
  },
});

export const addNumber = mutation({
  args: {
    value: v.number(),
  },
  handler: async (ctx, args) => {
    // Just return the value for now
    return args.value;
  },
});