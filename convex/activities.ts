import { v } from "convex/values";
import { query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { env } from "./env";
import OpenAI from "openai";
import { Doc } from "./_generated/dataModel";

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
    location: v.optional(v.string()),
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
    location: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // TODO - test if it's better to embed the whole activity OR
    const searchableText = [
      args.name,
      args.description || "",
      args.location || "", // TODO should location be there?
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
