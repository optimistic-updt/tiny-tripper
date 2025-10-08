"use node";

import FirecrawlApp from "@mendable/firecrawl-js";
import { internalAction } from "./_generated/server";
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

interface FetchFoxResponse {
  job_id: string;
  results: {
    items: Array<{
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
      _url?: string;
      _htmlUrl?: string;
    }>;
  };
  metrics?: Record<string, unknown>;
  artifacts?: unknown[];
}

const MAX_PAGES = 150;

/**
 * Scrape a website using FetchFox's /scrape endpoint
 */
async function scrapeFetchFox(
  url: string,
  maxPages: number,
): Promise<RawActivity[]> {
  try {
    // Validate URL format
    const urlObj = new URL(url);
    // Create a pattern for FetchFox - use ** wildcard to match all subpaths
    const pattern = `${urlObj.origin}/*`;

    console.log(`[FetchFox] Starting scrape for pattern: ${pattern}`);

    // Build template matching RawActivity structure
    const template = {
      name: "The name or title of the activity",
      description: "Detailed description of the activity",
      location: {
        name: "Location name",
        formattedAddress: "Full address",
        street_address: "Street address component",
        city: "City",
        state_province: "State or province",
        postal_code: "Postal or ZIP code",
        country_code: "ISO 3166-1 alpha-2 country code (e.g., US, CA, GB)",
      },
      startDate: "Start date in ISO 8601 format",
      endDate: "End date in ISO 8601 format",
      tags: ["Categories or tags for the activity"],
      imageURL: "URL of the primary image for this activity",
    };

    // Call FetchFox /scrape endpoint
    const response = await fetch("https://api.fetchfox.ai/api/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.FETCHFOX_API_KEY}`,
      },
      body: JSON.stringify({
        pattern,
        template,
        max_visits: maxPages,
        max_extracts: maxPages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FetchFox API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as FetchFoxResponse;

    if (!data.results?.items) {
      console.log("[FetchFox] No items found in response");
      return [];
    }

    // Map FetchFox items to RawActivity format
    const activities: RawActivity[] = data.results.items.map((item) => ({
      name: item.name,
      description: item.description,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      tags: item.tags,
      imageURL: item.imageURL,
    }));

    console.log(`[FetchFox] Extracted ${activities.length} activities`);
    return activities;
  } catch (error) {
    console.error("[FetchFox] Scraping failed:", error);
    if (error instanceof Error) {
      throw new Error(`FetchFox scraping failed: ${error.message}`);
    }
    throw new Error("FetchFox scraping failed with unknown error");
  }
}

/**
 * Scrape a website and extract activity data using Firecrawl
 */
export const scrapeWebsite = internalAction({
  args: {
    url: v.string(),
    maxDepth: v.optional(v.number()),
    maxPages: v.optional(v.number()),
  },
  handler: async (_ctx, args): Promise<RawActivity[]> => {
    // Validate URL format
    try {
      new URL(args.url);
    } catch {
      throw new Error(`Invalid URL format: ${args.url}`);
    }

    const maxPages = args.maxPages || MAX_PAGES;
    console.log(`Starting scrape for URL: ${args.url}`);
    console.log(`Config: maxPages=${maxPages}`);
    console.log(`Running both Firecrawl and FetchFox scrapers in parallel...`);

    // Helper function to run Firecrawl scraper
    const runFirecrawl = async (): Promise<RawActivity[]> => {
      try {
        console.log(`[Firecrawl] Starting scrape`);
        const firecrawl = new FirecrawlApp({
          apiKey: env.FIRECRAWL_API_KEY,
        });

        // Crawl the website to discover pages
        const crawlResponse = (await firecrawl.crawl(args.url, {
          limit: maxPages,
          scrapeOptions: {
            formats: ["markdown", "html"],
          },
        })) as CrawlResponse;

        if (crawlResponse.status !== "completed" || !crawlResponse.data) {
          throw new Error(`Firecrawl crawl failed: ${crawlResponse.status}`);
        }

        console.log(
          `[Firecrawl] Crawl completed. Processing ${crawlResponse.data.length} pages`,
        );

        // Collect all discovered URLs
        const discoveredUrls = crawlResponse.data
          .map((page) => page.url)
          .filter((url): url is string => typeof url === "string");

        if (discoveredUrls.length === 0) {
          console.log("[Firecrawl] No URLs discovered during crawl");
          return [];
        }

        console.log(
          `[Firecrawl] Discovered ${discoveredUrls.length} URLs. Extracting activity data...`,
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
          console.log("[Firecrawl] Extraction failed or returned no data");
          return [];
        }

        const allActivities = extractResponse.data.activities || [];
        console.log(
          `[Firecrawl] Extracted ${allActivities.length} total activities`,
        );

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
          `[Firecrawl] Complete. Found ${uniqueActivities.length} unique activities`,
        );
        return uniqueActivities;
      } catch (error) {
        console.error("[Firecrawl] Scraping failed:", error);
        throw error;
      }
    };

    // Run both scrapers in parallel
    const results = await Promise.allSettled([
      runFirecrawl(),
      scrapeFetchFox(args.url, maxPages),
    ]);

    // Extract results
    const firecrawlResult = results[0];
    const fetchfoxResult = results[1];

    // Log comparison results
    console.log("\n========================================");
    console.log("SCRAPER COMPARISON RESULTS");
    console.log("========================================\n");

    // Firecrawl results
    if (firecrawlResult.status === "fulfilled") {
      console.log(`[Firecrawl] Status: SUCCESS`);
      console.log(
        `[Firecrawl] Total activities: ${firecrawlResult.value.length}`,
      );
      console.log(`[Firecrawl] First 20 activities:`);
      firecrawlResult.value.slice(0, 20).forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.name}`);
      });
    } else {
      console.log(`[Firecrawl] Status: FAILED`);
      console.log(`[Firecrawl] Error: ${firecrawlResult.reason}`);
    }

    console.log("\n");

    // FetchFox results
    if (fetchfoxResult.status === "fulfilled") {
      console.log(`[FetchFox] Status: SUCCESS`);
      console.log(
        `[FetchFox] Total activities: ${fetchfoxResult.value.length}`,
      );
      console.log(`[FetchFox] First 20 activities:`);
      fetchfoxResult.value.slice(0, 20).forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.name}`);
      });
    } else {
      console.log(`[FetchFox] Status: FAILED`);
      console.log(`[FetchFox] Error: ${fetchfoxResult.reason}`);
    }

    console.log("\n========================================\n");

    // Return Firecrawl results (as requested)
    if (firecrawlResult.status === "fulfilled") {
      return firecrawlResult.value;
    } else {
      // If Firecrawl failed, throw the error
      throw new Error(
        `Firecrawl scraping failed: ${firecrawlResult.reason instanceof Error ? firecrawlResult.reason.message : "Unknown error"}`,
      );
    }
  },
});
