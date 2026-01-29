import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Set activity as hidden/visible
export const setActivityHidden = mutation({
  args: {
    activityId: v.id("activities"),
    hidden: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userActivityPreferences")
      .withIndex("by_userId_and_activityId", (q) =>
        q.eq("userId", identity.subject).eq("activityId", args.activityId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        hidden: args.hidden,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userActivityPreferences", {
        userId: identity.subject,
        activityId: args.activityId,
        hidden: args.hidden,
        createdAt: Date.now(),
      });
    }
    return null;
  },
});

// Set user's urgency override for an activity
export const setActivityUrgency = mutation({
  args: {
    activityId: v.id("activities"),
    urgency: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.null(), // Reset to activity's default
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userActivityPreferences")
      .withIndex("by_userId_and_activityId", (q) =>
        q.eq("userId", identity.subject).eq("activityId", args.activityId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        urgencyOverride: args.urgency ?? undefined,
        updatedAt: Date.now(),
      });
    } else if (args.urgency !== null) {
      await ctx.db.insert("userActivityPreferences", {
        userId: identity.subject,
        activityId: args.activityId,
        urgencyOverride: args.urgency,
        createdAt: Date.now(),
      });
    }
    return null;
  },
});

// Get user's preference for a specific activity
export const getActivityUserPreference = query({
  args: { activityId: v.id("activities") },
  returns: v.union(
    v.object({
      hidden: v.optional(v.boolean()),
      urgencyOverride: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const pref = await ctx.db
      .query("userActivityPreferences")
      .withIndex("by_userId_and_activityId", (q) =>
        q.eq("userId", identity.subject).eq("activityId", args.activityId),
      )
      .unique();

    if (!pref) return null;
    return {
      hidden: pref.hidden,
      urgencyOverride: pref.urgencyOverride,
    };
  },
});
