import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

const itemStatus = v.union(
  v.literal("discovered"),
  v.literal("queued"),
  v.literal("scraped"),
  v.literal("failed"),
);

/**
 * All items previously discovered for this source. Detectors use this as the
 * "seen set" — anything not in here is new, anything with a changed `lastmod`
 * is updated.
 */
export const listBySource = internalQuery({
  args: { sourceId: v.id("scrapingSources") },
  returns: v.array(v.any()),
  handler: async (ctx, { sourceId }) => {
    return await ctx.db
      .query("scrapingSourceItems")
      .withIndex("by_source_and_url", (q) => q.eq("sourceId", sourceId))
      .collect();
  },
});

/**
 * Upsert a batch of items by (sourceId, url). Inserts new rows with status
 * `discovered`; for existing rows, updates `lastSeenAt` / `lastmod` /
 * `contentHash`. Status is left alone on update — the caller (or the Tier 2
 * dispatcher) is responsible for moving rows to `queued`/`scraped`/`failed`.
 */
export const upsertBatch = internalMutation({
  args: {
    sourceId: v.id("scrapingSources"),
    items: v.array(
      v.object({
        url: v.string(),
        lastmod: v.optional(v.string()),
        contentHash: v.optional(v.string()),
      }),
    ),
    now: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { sourceId, items, now }) => {
    for (const item of items) {
      const existing = await ctx.db
        .query("scrapingSourceItems")
        .withIndex("by_source_and_url", (q) =>
          q.eq("sourceId", sourceId).eq("url", item.url),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          lastSeenAt: now,
          lastmod: item.lastmod ?? existing.lastmod,
          contentHash: item.contentHash ?? existing.contentHash,
        });
      } else {
        await ctx.db.insert("scrapingSourceItems", {
          sourceId,
          url: item.url,
          lastmod: item.lastmod,
          contentHash: item.contentHash,
          firstSeenAt: now,
          lastSeenAt: now,
          status: "discovered",
        });
      }
    }
    return null;
  },
});

/**
 * Mark an item as queued for detail scrape and record the workflow id.
 * Called after Tier 2 dispatch so we don't re-queue the same URL next tick.
 */
export const markQueued = internalMutation({
  args: {
    sourceId: v.id("scrapingSources"),
    url: v.string(),
    detailWorkflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { sourceId, url, detailWorkflowId }) => {
    const existing = await ctx.db
      .query("scrapingSourceItems")
      .withIndex("by_source_and_url", (q) =>
        q.eq("sourceId", sourceId).eq("url", url),
      )
      .unique();
    if (!existing) return null;
    await ctx.db.patch(existing._id, { status: "queued", detailWorkflowId });
    return null;
  },
});

/**
 * Manual status transition — useful if a downstream workflow completion
 * callback wants to flip discovered/queued rows to `scraped` or `failed`.
 */
export const setStatus = internalMutation({
  args: {
    sourceId: v.id("scrapingSources"),
    url: v.string(),
    status: itemStatus,
  },
  returns: v.null(),
  handler: async (ctx, { sourceId, url, status }) => {
    const existing = await ctx.db
      .query("scrapingSourceItems")
      .withIndex("by_source_and_url", (q) =>
        q.eq("sourceId", sourceId).eq("url", url),
      )
      .unique();
    if (!existing) return null;
    await ctx.db.patch(existing._id, { status });
    return null;
  },
});
