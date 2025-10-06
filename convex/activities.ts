import { v } from "convex/values";
import { query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { env } from "./env";
import OpenAI from "openai";
import { Id, Doc } from "./_generated/dataModel";
import { GeospatialIndex } from "@convex-dev/geospatial";
import { components } from "./_generated/api";

const geospatial = new GeospatialIndex<
  Id<"activities">,
  { tags: string[]; urgency: "low" | "medium" | "high" }
>(components.geospatial);

const OpenAIClient = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const generateEmbedding = async (text: string) => {
  try {
    const embedding = await OpenAIClient.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return embedding.data[0].embedding;

    // TODO here
  } catch (error) {
    return [];
  }
};

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

export const createActivityDocument = internalMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    urgency: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    location: v.optional(
      v.object({
        name: v.string(),
        placeId: v.string(), // Google Places ID
        formattedAddress: v.string(),
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),
        street_address: v.optional(v.string()),
        city: v.optional(v.string()),
        state_province: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        country_code: v.optional(v.string()), // ISO 3166-1 alpha-2
      }),
    ),
    endDate: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    embedding: v.optional(v.array(v.float64())),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const activityId = await ctx.db.insert("activities", {
      name: args.name,
      description: args.description,
      urgency: args.urgency ?? "medium",
      location: args.location,
      endDate: args.endDate,
      isPublic: args.isPublic ?? false,
      userId: identity?.subject,
      tags: args.tags,
      embedding: args.embedding,
    });

    if (args.location?.latitude && args.location?.longitude) {
      await geospatial.insert(
        ctx,
        activityId,
        {
          latitude: args.location.latitude,
          longitude: args.location.longitude,
        },
        {
          tags: args.tags || [],
          urgency: args.urgency || "medium",
        },
      );
    }

    return activityId;
  },
});

export const createActivity = action({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    urgency: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    location: v.optional(
      v.object({
        name: v.string(),
        placeId: v.string(), // Google Places ID
        formattedAddress: v.string(),
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),
        street_address: v.optional(v.string()),
        city: v.optional(v.string()),
        state_province: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        country_code: v.optional(v.string()), // ISO 3166-1 alpha-2
      }),
    ),
    endDate: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // TODO - test if it's better to embed the whole activity OR
    const searchableText = [
      args.name,
      args.description || "",
      args.location?.name || "",
      args.location?.formattedAddress || "",
      ...(args.tags || []),
    ].join(" ");

    const embedding = await generateEmbedding(searchableText);

    const doc = {
      ...args,
      embedding,
    };

    await ctx.runMutation(internal.activities.createActivityDocument, doc);
  },
});

export const listActivities = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    return await ctx.db
      .query("activities")
      .filter((q) =>
        q.or(
          q.eq(q.field("isPublic"), true),
          q.eq(q.field("userId"), identity?.subject),
        ),
      )
      .order("desc")
      .collect();
  },
});

export const getActivity = query({
  args: {
    id: v.id("activities"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const searchActivities = action({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    // if (!args.searchTerm.trim()) {
    //   return await ctx.runQuery(api.activities.listActivities);
    // }

    const embedding = await generateEmbedding(args.searchTerm);

    const results = await ctx.vectorSearch("activities", "by_embedding", {
      vector: embedding,
      limit: 20,
    });

    console.log("embedding result", results);

    const activities: Array<Doc<"activities"> | null> = await Promise.all(
      results.map(async (result) => {
        const activity = await ctx.runQuery(api.activities.getActivity, {
          id: result._id,
        });

        return activity;
      }),
    );

    return activities.filter((activity) => activity !== null);
  },
});

// getRecommendation prioritizes
// activities based on:

// 1. Urgency Level (100/50/10
// points)
// 2. End Date within 2 weeks
// (80+ points, bonus for sooner
// deadlines)
// 3. User's own activities (30
// points)
// 4. Activities with location
// (10 points)
// 5. Activities with tags (5
// points)
export const getRecommendation = query({
  args: {
    excludeIds: v.optional(v.array(v.id("activities"))),
    filters: v.optional(
      v.object({
        atHome: v.boolean(),
        rainproof: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Get all available activities
    const allActivities = await ctx.db
      .query("activities")
      .filter((q) =>
        q.or(
          q.eq(q.field("isPublic"), true),
          q.eq(q.field("userId"), identity?.subject),
        ),
      )
      .collect();

    // Filter and score activities
    const scoredActivities = allActivities
      .filter((activity) => {
        // Exclude previously shown activities
        if (args.excludeIds?.includes(activity._id)) {
          return false;
        }

        // Filter out activities that have passed their end date
        if (activity.endDate) {
          const endDate = new Date(activity.endDate);
          if (endDate < now) {
            return false;
          }
        }

        // Apply tag filters (AND logic)
        if (args.filters) {
          const { atHome, rainproof } = args.filters;
          const tags = activity.tags || [];

          // If atHome filter is active, activity must have "at home" tag
          if (atHome && !tags.includes("at home")) {
            return false;
          }

          // If rainproof filter is active, activity must have "rainproof" tag
          if (rainproof && !tags.includes("rain-approved")) {
            return false;
          }
        }

        return true;
      })
      .map((activity) => {
        let score = 0;

        // Priority 1: Urgency (highest weight)
        if (activity.urgency === "high") {
          score += 100;
        } else if (activity.urgency === "medium") {
          score += 50;
        } else {
          score += 10;
        }

        // Priority 2: End date within next two weeks (high weight)
        if (activity.endDate) {
          const endDate = new Date(activity.endDate);
          if (endDate <= twoWeeksFromNow) {
            score += 80;
            // Extra points for activities ending sooner
            const daysUntilEnd = Math.max(
              1,
              Math.ceil(
                (endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
              ),
            );
            score += Math.max(0, 20 - daysUntilEnd); // More points for sooner deadlines
          }
        }

        // Priority 3: User's own activities (medium weight)
        if (activity.userId === identity?.subject) {
          score += 30;
        }

        // Priority 4: Activities with location (small bonus)
        if (activity.location) {
          score += 10;
        }

        // Priority 5: Activities with tags (small bonus for rich content)
        if (activity.tags && activity.tags.length > 0) {
          score += 5;
        }

        return { ...activity, score };
      })
      .sort((a, b) => b.score - a.score);

    // Return the highest scored activity, or null if none found
    return scoredActivities.length > 0 ? scoredActivities[0] : null;
  },
});
