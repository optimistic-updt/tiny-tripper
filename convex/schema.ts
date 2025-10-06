import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  activities: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    location: v.optional(
      v.object({
        name: v.string(),
        placeId: v.string(), // Google Places ID
        formattedAddress: v.string(),
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),
        // -- Structured address fields
        street_address: v.optional(v.string()),
        city: v.optional(v.string()),
        state_province: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        country_code: v.optional(v.string()), // ISO 3166-1 alpha-2
      }),
    ),
    endDate: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    embedding: v.optional(v.array(v.float64())),
    imageId: v.optional(v.id("_storage")),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
  }),

  tags: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),
});
