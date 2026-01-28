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
        placeId: v.optional(v.string()), // Google Places ID
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
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    embedding: v.optional(v.array(v.float64())),
    imageId: v.optional(v.id("_storage")),
  })
    .index("by_name", ["name"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
    }),

  tags: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  scrapeWorkflows: defineTable({
    workflowId: v.string(),
    url: v.string(),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    startedAt: v.string(),
    completedAt: v.optional(v.string()),
    config: v.object({
      maxDepth: v.optional(v.number()),
      maxPages: v.optional(v.number()),
      maxExtractions: v.optional(v.number()),
      autoImport: v.optional(v.boolean()),
      urgencyDefault: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      ),
      tagsHint: v.optional(v.array(v.string())),
      useMockScrape: v.optional(v.boolean()),
    }),
    // Storage file IDs for intermediate and final data
    files: v.object({
      rawActivities: v.optional(v.id("_storage")),
      imagesMap: v.optional(v.id("_storage")),
      geocodedMap: v.optional(v.id("_storage")),
      embeddingsMap: v.optional(v.id("_storage")),
      mergedActivities: v.optional(v.id("_storage")),
      finalJsonl: v.optional(v.id("_storage")),
    }),
    activitiesProcessed: v.optional(v.number()),
    importSummary: v.optional(
      v.object({
        imported: v.number(),
        skipped: v.number(),
        failed: v.number(),
        errors: v.array(v.string()),
      }),
    ),
  }).index("by_workflowId", ["workflowId"]),

  quizResponses: defineTable({
    // Contact info (Step 1)
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    detectedCity: v.optional(v.string()),
    detectedCountry: v.optional(v.string()),

    // Scoring questions (Q1-Q10) - each is 0 or 1 point
    q1_overwhelmed_options: v.number(),
    q2_end_up_home: v.number(),
    q3_same_activities: v.number(),
    q4_research_time: v.number(),
    q5_weather_ruins: v.number(),
    q6_energy_after_work: v.number(),
    q7_partner_disagree: v.number(),
    q8_kids_bored: v.number(),
    q9_last_minute: v.number(),
    q10_guilt_screen_time: v.number(),

    // Calculated score (0-10)
    totalScore: v.number(),
    scorePercentage: v.number(),

    // Qualifying questions (Q11-Q15)
    q11_situation: v.string(),
    q12_desired_outcome: v.string(),
    q13_obstacles: v.string(),
    q14_budget_indicator: v.string(),
    q15_anything_else: v.optional(v.string()),

    // Metadata
    completedAt: v.number(),
    userId: v.optional(v.string()),
    abTestVariant: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_completedAt", ["completedAt"])
    .index("by_userId", ["userId"]),
});
