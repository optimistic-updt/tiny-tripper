import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

export const createActivity = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    urgency: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    location: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const activityId = await ctx.db.insert("activities", {
      name: args.name,
      description: args.description,
      urgency: args.urgency,
      location: args.location,
      endDate: args.endDate,
      isPublic: args.isPublic ?? false,
      userId: identity?.subject,
    });

    return activityId;
  },
});

export const listActivities = query({
  args: {},

  handler: async (ctx) => {
    // const identity = await ctx.auth.getUserIdentity();

    return await ctx.db
      .query("activities")
      // .filter((q) =>
      //   q.or(
      //     q.eq(q.field("isPublic"), true),
      //     q.eq(q.field("userId"), identity?.subject),
      //   ),
      // )
      .order("desc")
      .collect();
  },
});
