import FirecrawlApp from "@mendable/firecrawl-js";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { env } from "./env";

/**
 * Extraction prompt for LLM-based activity data extraction from web pages
 */
const ACTIVITY_EXTRACTION_PROMPT = `Extract activity information from this page. For each activity found, extract the following fields:

Required:
- name (string): The name/title of the activity

Optional:
- description (string): Detailed description of the activity
- location (object):
  - name (string): Location name
  - formattedAddress (string): Full address
  - street_address (string): Street address component
  - city (string): City
  - state_province (string): State or province
  - postal_code (string): Postal/ZIP code
  - country_code (string): ISO 3166-1 alpha-2 country code
- startDate (string): Start date in ISO 8601 format
- endDate (string): End date in ISO 8601 format
- tags (array of strings): Categories or tags for the activity
- imageURL (string): URL of the primary image for this activity

Return an array of activity objects. If no activities are found, return an empty array.`;

export interface RawActivity {
  name: string;
  description?: string;
  location?: {
    name?: string;
    formattedAddress?: string;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country_code?: string;
  };
  startDate?: string;
  endDate?: string;
  tags?: string[];
  imageURL?: string;
}

interface CrawlPage {
  url?: string;
  markdown?: string;
  html?: string;
  metadata?: Record<string, unknown>;
}

interface CrawlResponse {
  status: string;
  data?: CrawlPage[];
}

interface ExtractResponse {
  success: boolean;
  data?: {
    activities: RawActivity[];
  };
}

const MAX_PAGES = 150;

/**
 * Scrape a website and extract activity data using Firecrawl
 */
export const scrapeWebsite = action({
  args: {
    url: v.string(),
    maxDepth: v.optional(v.number()),
    maxPages: v.optional(v.number()),
  },
  handler: async (_ctx, args): Promise<RawActivity[]> => {
    try {
      // Validate URL format
      try {
        new URL(args.url);
      } catch {
        throw new Error(`Invalid URL format: ${args.url}`);
      }

      // Initialize Firecrawl client
      const firecrawl = new FirecrawlApp({
        apiKey: env.FIRECRAWL_API_KEY,
      });

      console.log(`Starting scrape for URL: ${args.url}`);
      console.log(`Config: maxPages=${args.maxPages || MAX_PAGES}`);

      // First, crawl the website to discover pages
      const crawlResponse = (await firecrawl.crawl(args.url, {
        limit: args.maxPages || MAX_PAGES,
        scrapeOptions: {
          formats: ["markdown", "html"],
        },
      })) as CrawlResponse;

      if (crawlResponse.status !== "completed" || !crawlResponse.data) {
        throw new Error(`Firecrawl crawl failed: ${crawlResponse.status}`);
      }

      console.log(
        `Crawl completed. Processing ${crawlResponse.data.length} pages`,
      );

      // Collect all discovered URLs
      const discoveredUrls = crawlResponse.data
        .map((page) => page.url)
        .filter((url): url is string => typeof url === "string");

      if (discoveredUrls.length === 0) {
        console.log("No URLs discovered during crawl");
        return [];
      }

      console.log(
        `Discovered ${discoveredUrls.length} URLs. Extracting activity data...`,
      );

      // Use extract to get structured activity data from all pages
      const extractResponse = (await firecrawl.extract({
        urls: discoveredUrls,
        prompt: ACTIVITY_EXTRACTION_PROMPT,
        schema: {
          type: "object",
          properties: {
            activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  location: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      formattedAddress: { type: "string" },
                      street_address: { type: "string" },
                      city: { type: "string" },
                      state_province: { type: "string" },
                      postal_code: { type: "string" },
                      country_code: { type: "string" },
                    },
                  },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                  },
                  imageURL: { type: "string" },
                },
                required: ["name"],
              },
            },
          },
          required: ["activities"],
        },
      })) as ExtractResponse;

      if (!extractResponse.success || !extractResponse.data) {
        console.warn("Extraction failed or returned no data");
        return [];
      }

      const allActivities = extractResponse.data.activities || [];
      console.log(`Extracted ${allActivities.length} total activities`);

      // Deduplicate activities by name (basic deduplication)
      const uniqueActivities = allActivities.reduce((acc, activity) => {
        const existingIndex = acc.findIndex((a) => a.name === activity.name);
        if (existingIndex === -1) {
          acc.push(activity);
        } else {
          // Merge data if duplicate found (prefer more complete data)
          const existing = acc[existingIndex];
          acc[existingIndex] = {
            ...existing,
            ...activity,
            // Keep existing values if new one is undefined
            description: activity.description || existing.description,
            location: activity.location || existing.location,
            startDate: activity.startDate || existing.startDate,
            endDate: activity.endDate || existing.endDate,
            tags:
              activity.tags && activity.tags.length > 0
                ? activity.tags
                : existing.tags,
            imageURL: activity.imageURL || existing.imageURL,
          };
        }
        return acc;
      }, [] as RawActivity[]);

      console.log(
        `Scraping complete. Found ${uniqueActivities.length} unique activities`,
      );

      return uniqueActivities;
    } catch (error) {
      console.error("Scraping failed:", error);

      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Website scraping failed: ${error.message}`);
      }

      throw new Error("Website scraping failed with unknown error");
    }
  },
});
