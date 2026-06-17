import { v } from "convex/values";
import {
  internalQuery,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { scrapeOptions, scrapingSourceDetector } from "./schema";
import type { Doc } from "./_generated/dataModel";

/**
 * Interval in milliseconds for each scheduling cadence. Used by `listDue`
 * to decide whether a source is ready for another check.
 */
const INTERVAL_MS: Record<Doc<"scrapingSources">["interval"], number | null> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000, // approximate — good enough for cron tick
  manual: null, // never auto-due
};

// -------------------------------------------------------------------------
// Public API — register and manage sources from the app
// -------------------------------------------------------------------------

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.query("scrapingSources").collect();
  },
});

export const register = mutation({
  args: {
    url: v.string(),
    name: v.optional(v.string()),
    interval: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("manual"),
    ),
    detector: scrapingSourceDetector,
    detailScrapeOptions: v.optional(v.object(scrapeOptions)),
    active: v.optional(v.boolean()),
  },
  returns: v.id("scrapingSources"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.insert("scrapingSources", {
      url: args.url,
      name: args.name,
      interval: args.interval,
      detector: args.detector,
      detailScrapeOptions: args.detailScrapeOptions,
      active: args.active ?? true,
      createdAt: Date.now(),
    });
  },
});

export const setActive = mutation({
  args: { sourceId: v.id("scrapingSources"), active: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { sourceId, active }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.patch(sourceId, { active });
    return null;
  },
});

/**
 * Manually trigger a detection run now, bypassing the interval schedule.
 * Useful for `interval: "manual"` sources and for testing.
 */
export const runNow = mutation({
  args: { sourceId: v.id("scrapingSources") },
  returns: v.null(),
  handler: async (ctx, { sourceId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.scheduler.runAfter(0, internal.changeTracking.detectChanges, {
      sourceId,
    });
    return null;
  },
});

// -------------------------------------------------------------------------
// Internal API — used by the change-tracking pipeline
// -------------------------------------------------------------------------

export const get = internalQuery({
  args: { sourceId: v.id("scrapingSources") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, { sourceId }) => {
    return await ctx.db.get(sourceId);
  },
});

/**
 * Active sources whose `lastCheckedAt + interval` is in the past.
 * Excludes `interval: "manual"` rows — those run only via explicit trigger.
 */
export const listDue = internalQuery({
  args: { now: v.number() },
  returns: v.array(v.any()),
  handler: async (ctx, { now }) => {
    const active = await ctx.db
      .query("scrapingSources")
      .withIndex("by_active_lastCheckedAt", (q) => q.eq("active", true))
      .collect();

    return active.filter((s) => {
      const intervalMs = INTERVAL_MS[s.interval];
      if (intervalMs == null) return false;
      const lastChecked = s.lastCheckedAt ?? 0;
      return lastChecked + intervalMs <= now;
    });
  },
});

/**
 * Update bookkeeping after a detection run. Always bumps `lastCheckedAt`;
 * bumps `lastChangeAt` only when the detector actually found changes.
 */
export const markChecked = internalMutation({
  args: {
    sourceId: v.id("scrapingSources"),
    checkedAt: v.number(),
    changed: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { sourceId, checkedAt, changed }) => {
    const patch: Partial<Doc<"scrapingSources">> = {
      lastCheckedAt: checkedAt,
    };
    if (changed) patch.lastChangeAt = checkedAt;
    await ctx.db.patch(sourceId, patch);
    return null;
  },
});
