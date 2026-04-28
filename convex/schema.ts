import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const scrapeOptions = {
  // what scraper to use
  scraper: v.optional(v.union(v.literal("fetchfox"), v.literal("firecrawl"))),
  // number of page to visit/crawl
  maxCrawlVisit: v.optional(v.number()), // should default to 50
  // Maximum depth from the root URL based on link-discovery hops, not the number of / segments in the URL. Each time a new URL is found on a page, it is assigned a depth one higher than the page it was discovered on. The root site and sitemapped pages have a discovery depth of 0. Pages at the max depth are still scraped, but links on them are not followed.
  maxDepth: v.optional(v.number()), //should default to 3
  // ??
  maxExtractions: v.optional(v.number()),
  // follow external links. if a crawler finds a link to another site, it will follow it
  followExternalLinks: v.optional(v.boolean()),
  // hint on the type of activities to expect, to help the LLM extraction. e.g. "outdoor", "family-friendly", "budget", etc.
  tagsHint: v.optional(v.array(v.string())),
};

export const workflowConfig = {
  // import scraped activities into the activities table once the workflow finishes
  autoImport: v.optional(v.boolean()),
  // urgency assigned to imported activities when the scrape doesn't provide one
  urgencyDefault: v.optional(
    v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  ),
  // skip the real scraper and return mock data — for development/testing
  useMockScrape: v.optional(v.boolean()),
};

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
      ...scrapeOptions,
      ...workflowConfig,
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

  userActivityPreferences: defineTable({
    userId: v.string(), // Clerk user ID
    activityId: v.id("activities"),
    hidden: v.optional(v.boolean()), // Never show this activity
    urgencyOverride: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_activityId", ["userId", "activityId"]),

  scrapingSources: defineTable({
    url: v.string(),
    name: v.optional(v.string()),
    type: v.union(
      v.literal("website"),
      v.literal("social_media"),
      v.literal("other"),
    ),
    interval: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("manual"),
    ),
    on: v.optional(v.number()), // 0 monday, 1 tuesday, ..., 6 sunday OR 0 january, 1 february, ..., 11 december
    createdAt: v.number(),
    active: v.optional(v.boolean()),
    lastCheckedAt: v.optional(v.number()),
    lastChangeAt: v.optional(v.number()),
    lastChangePreviousScrapeAt: v.optional(v.string()),
    scrapeConfig: v.optional(
      v.object({
        ...scrapeOptions,
        urgencyDefault: v.optional(
          v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        ),
      }),
    ),
  }).index("by_active_lastCheckedAt", ["active", "lastCheckedAt"]),
});
