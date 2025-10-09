"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { env } from "./env";

// /**
//  * Extraction prompt for LLM-based activity data extraction from web pages
//  */
// const ACTIVITY_EXTRACTION_PROMPT = `Extract activity information from this page. For each activity found, extract the following fields:

// Required:
// - name (string): The name/title of the activity

// Optional:
// - description (string): Detailed description of the activity
// - location (object):
//   - name (string): Location name
//   - formattedAddress (string): Full address
//   - street_address (string): Street address component
//   - city (string): City
//   - state_province (string): State or province
//   - postal_code (string): Postal/ZIP code
//   - country_code (string): ISO 3166-1 alpha-2 country code
// - startDate (string): Start date in ISO 8601 format
// - endDate (string): End date in ISO 8601 format
// - tags (array of strings): Categories or tags for the activity
// - imageURL (string): URL of the primary image for this activity

// Return an array of activity objects. If no activities are found, return an empty array.`;

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
const MAX_DEPTH = 99;

/**
 * Scrape a website using FetchFox's /scrape endpoint
 */
async function scrapeFetchFox(
  url: string,
  maxPages: number,
  maxDepth: number,
  maxExtractions: number,
  tagsHint?: string[],
): Promise<RawActivity[]> {
  try {
    // Validate URL format
    const urlObj = new URL(url);
    // Create a pattern for FetchFox - use ** wildcard to match all subpaths
    const pattern = `${urlObj.href}/**`;

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
      tags: [
        `Categories or tags for the activity, don't include anything related to the address. keep me more theme oriented. ${tagsHint ? `make sure you include these if suited: ${tagsHint.join(", ")}` : ""}`,
      ],
      imageURL: "URL of the primary image for this activity",
    };

    const response = await fetch("https://api.fetchfox.ai/api/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.FETCHFOX_API_KEY}`,
      },
      body: JSON.stringify({
        pattern,
        start_urls: [urlObj.origin],
        template,
        max_visits: maxPages,
        max_depth: maxDepth,
        max_extracts: maxExtractions,
        content_transform: "slim_html",
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
    console.table(data.metrics);

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
    maxExtractions: v.optional(v.number()),
    tagsHint: v.optional(v.array(v.string())),
  },
  handler: async (_ctx, args): Promise<RawActivity[]> => {
    // Validate URL format
    try {
      new URL(args.url);
    } catch {
      throw new Error(`Invalid URL format: ${args.url}`);
    }

    const maxDepth = args.maxDepth || MAX_DEPTH;
    const maxPages = args.maxPages || MAX_PAGES;
    const maxExtractions = args.maxExtractions || MAX_PAGES;
    console.log(`Starting scrape for URL: ${args.url}`);
    console.table({ args });

    const results = await Promise.allSettled([
      scrapeFetchFox(
        args.url,
        maxPages,
        maxDepth,
        maxExtractions,
        args.tagsHint,
      ),
      // runFirecrawl(args.url, maxPages),
    ]);

    // Extract results
    const fetchfoxResult = results[0];

    // Return FetchFox results (as requested)
    if (fetchfoxResult.status === "fulfilled") {
      return fetchfoxResult.value;
    } else {
      // If FetchFox failed, throw the error
      throw new Error(
        `FetchFox scraping failed: ${fetchfoxResult.reason instanceof Error ? fetchfoxResult.reason.message : "Unknown error"}`,
      );
    }
  },
});
