import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { normalizeTag } from "./activities";

export const listTags = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { search, limit = 50 } = args;

    const query = ctx.db.query("tags");

    if (search && search.trim()) {
      // Filter tags that start with or contain the search term (case-insensitive)
      const tags = await query.collect();
      const filtered = tags.filter(tag =>
        tag.name.toLowerCase().includes(search.toLowerCase())
      );
      return filtered
        .sort((a, b) => {
          // Prioritize tags that start with the search term
          const aStarts = a.name.toLowerCase().startsWith(search.toLowerCase());
          const bStarts = b.name.toLowerCase().startsWith(search.toLowerCase());
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, limit);
    }

    return await query
      .order("asc")
      .take(limit);
  },
});

export const createTag = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedName = normalizeTag(args.name);

    if (!normalizedName) {
      throw new Error("Tag name cannot be empty");
    }

    const existingTag = await ctx.db
      .query("tags")
      .withIndex("by_name", (q) => q.eq("name", normalizedName))
      .first();

    if (existingTag) {
      return existingTag;
    }

    const tagId = await ctx.db.insert("tags", {
      name: normalizedName,
      createdAt: Date.now(),
    });

    return await ctx.db.get(tagId);
  },
});

export const getOrCreateTags = mutation({
  args: {
    names: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results = [];
    const seen = new Set<string>();

    for (const name of args.names) {
      const normalizedName = normalizeTag(name);
      if (!normalizedName || seen.has(normalizedName)) continue;
      seen.add(normalizedName);

      let tag = await ctx.db
        .query("tags")
        .withIndex("by_name", (q) => q.eq("name", normalizedName))
        .first();

      if (!tag) {
        const tagId = await ctx.db.insert("tags", {
          name: normalizedName,
          createdAt: Date.now(),
        });
        tag = await ctx.db.get(tagId);
      }

      if (tag) {
        results.push(tag);
      }
    }

    return results;
  },
});