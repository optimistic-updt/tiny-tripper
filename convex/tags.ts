import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
    const trimmedName = args.name.trim();

    if (!trimmedName) {
      throw new Error("Tag name cannot be empty");
    }

    // Check if tag already exists (case-insensitive)
    const existingTag = await ctx.db
      .query("tags")
      .filter(q => q.eq(q.field("name"), trimmedName))
      .first();

    if (existingTag) {
      return existingTag;
    }

    const tagId = await ctx.db.insert("tags", {
      name: trimmedName,
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

    for (const name of args.names) {
      const trimmedName = name.trim();
      if (!trimmedName) continue;

      // Try to find existing tag first
      let tag = await ctx.db
        .query("tags")
        .filter(q => q.eq(q.field("name"), trimmedName))
        .first();

      // Create tag if it doesn't exist
      if (!tag) {
        const tagId = await ctx.db.insert("tags", {
          name: trimmedName,
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