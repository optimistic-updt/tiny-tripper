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

const MOCK_ACTIVITIES: RawActivity[] = [
  {
    name: "Anthony Beale Reserve, St Helena",
    description:
      "Tucked away among the homes in St Helena is a bright, colourful playground with lots of equipment: a large human-sized revolving wheel, a stand-on carousel, small slides, rope-net climbing frame, two stand-on spinners, wooden stump balance trail, bird's nest swing, hammock and a double flying fox (disk seat and harness). There is a wheelchair-accessible sandpit with a creek water feature, hand pump and sluice gates. The reserve also includes a half basketball court and a small junior skate area with ramp. Facilities noted: park benches, picnic tables, pram access, walking/bike tracks, Wi-Fi, BBQ, water tap, wheelchair access and toilets. Suitable for a range of ages and abilities. Tip: bring scooters. Nearby recommendation: Watermarc Greensborough for indoor water play and lessons.",
    location: {
      name: "Anthony Beale Reserve",
      formattedAddress: "277 St Helena Rd, St Helena, Australia",
      street_address: "277 St Helena Rd",
      city: "St Helena",
      state_province: undefined,
      postal_code: undefined,
      country_code: "AU",
    },
    startDate: "2017-08-22T19:04:36+10:00",
    endDate: undefined,
    tags: ["park", "playground", "family", "accessible", "outdoor"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/599bf2d22994caf792a50a95/1602462506330/anthony+front.jpg?format=1500w",
  },
  {
    name: "ANZAC Memorial Park, Hurstbridge",
    description:
      "Nestled amongst greenery and surrounded by cafes, Anzac Memorial Park is a smaller but engaging playground. Features include a medical tent role-play, army tank play, ropes course, word-search/maze activities, picnic tables and nearby cafes. Fenced from the road (no gate). Mamma's tip: grab a coffee from Black Vice Cafe and Roastery.",
    location: {
      name: "Anzac Memorial Park, Hurstbridge",
      formattedAddress:
        "910 Heidelberg - Kinglake Rd, Hurstbridge VIC 3099, Australia",
      street_address: "910 Heidelberg - Kinglake Rd",
      city: "Hurstbridge",
      state_province: "VIC",
      postal_code: "3099",
      country_code: "AU",
    },
    startDate: "2024-08-27T20:01:35+10:00",
    endDate: undefined,
    tags: ["park", "playground", "family", "outdoors", "picnic"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/3c62c1e8-c10c-41b2-8fd1-925aa6bbf489/Copyright+Mamma+Knows+Melbourne+-+ANZAC+Park%2C+Hurstbridge-3754.jpg",
  },
  {
    name: "Aspect's Destination Drive Park, Greenvale",
    description:
      "This community playground on Destination Drive in Greenvale features slides, rope climbing frames, swings, see-saw, a rodeo platform and a flying fox. Built for all ages with great views over Greenvale Reservoir and surrounding parklands. Suitable for family picnics and birthday visits; facilities mention pram access, parking, BBQs, shelters, seating, toilets, basketball court and a soccer field. Note: bring snacks. Mamma's special mention lists other nearby Peet parks.",
    location: {
      name: "Aspect Park (Destination Drive Park)",
      formattedAddress: "Destination Dr, Greenvale VIC 3059, AU",
      street_address: "Destination Dr",
      city: "Greenvale",
      state_province: "VIC",
      postal_code: "3059",
      country_code: "AU",
    },
    startDate: "2017-05-11T20:55:28+1000",
    endDate: undefined,
    tags: ["park", "playground", "family", "picnic", "outdoor", "play-equipment"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/591442f0cd0f68c944f8a32c/1602462643902/Destination+Drive+-+Mamma+Knows+North+%2814+of+14%29.jpg?format=1500w",
  },
  {
    name: "Alistair Knox Park, Eltham",
    description:
      "The Alistair Knox Reserve in Eltham is a community hub with a large play area among gum trees. Features include large wooden carvings (platypus, owl, tree-stump seat), metal figures, and a main play structure with a curved slide, walkways, hanging disks, rising step bridge, steering wheel, tunnel, scrambling wall, shop front and monkey bars. Additional equipment: spinning donut, music-making equipment, bird's-nest swing and a family-sized see-saw. Grounds include rocks to jump across and paths along the Diamond Creek. Facilities mentioned: toilets, car park, BBQ, BMX track, walking/bike track, picnic tables and shaded areas. Suitable for families with toddlers and older children. Tip: Grab a bite at Shillinglaw Cafe or visit Eltham Library storytime. More info available on the Nillumbik council page.",
    location: {
      name: "Alistair Knox Reserve",
      formattedAddress: "829 Main Rd, Eltham, Australia",
      street_address: "829 Main Rd",
      city: "Eltham",
      state_province: undefined,
      postal_code: undefined,
      country_code: "AU",
    },
    startDate: "2017-07-05T10:34:30+1000",
    endDate: undefined,
    tags: ["park", "playground", "family", "outdoors", "picnic", "play-equipment"],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/595c338be4fcb506751e8c75/1602462574078/alisterfront.jpg?format=1500w",
  },
  {
    name: "AJ Davis Reserve Playground, Airport West",
    description:
      "New playground at AJ Davis Reserve in Airport West. Unique multi-level natural play on a hillside with climbing features, boulders, logs, yellow soft fall, steep fast tube slides, swings, roundabout, dry river bed (BYO diggers) and many paths. Facilities noted: bench seats, undercover picnic tables and carpark; no toilets. Suitable for adventurous children; parental supervision recommended. Nearby food option: Slices (Keilor) a short drive away.",
    location: {
      name: "AJ Davis Reserve Playground",
      formattedAddress: "298 Fullarton Rd, Airport West",
      street_address: "298 Fullarton Rd",
      city: "Airport West",
      state_province: undefined,
      postal_code: undefined,
      country_code: "AU",
    },
    startDate: "2023-07-26T16:45:27+1000",
    endDate: undefined,
    tags: ["park", "playground", "natural play", "family", "outdoor", "slides"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/64c0a9292ee2932e8d44d3e1/1690353927253/aj+davis+reserve+playground%2C+airport+west+-+copyright+2023+mamma+knows+melbourne.jpg?format=1500w",
  },
  {
    name: "A.H. Capp Reserve, Preston",
    description:
      "Mamma thinks you'd be hard-pressed finding a more tranquil, fun and spacious spot for a play with the kids and dog. A.H. Capp Reserve has picnic tables, shade and a playground with elements suited to both younger and older kids (rock-climbing wall, large slide, chain bridge, smaller slide, noughts and crosses), a merri-go-round, swings (including a basket swing), a basketball court, leash-free dog oval and exercise equipment. The reserve is set along the Merri Creek Trail, offering a pretty and peaceful setting. There are undercover picnic tables and toilets at the sports pavilion. Mamma's tip: grab a coffee & pastry from Joe's Market Garden on your way (open Saturdays).",
    location: {
      name: "A.H. Capp Reserve",
      formattedAddress: "13 Halwyn Cres, Preston VIC 3072, AU",
      street_address: "13 Halwyn Cres",
      city: "Preston",
      state_province: "VIC",
      postal_code: "3072",
      country_code: "AU",
    },
    startDate: "2020-03-01T19:23:03+1100",
    endDate: undefined,
    tags: [
      "park",
      "playground",
      "dog-friendly",
      "picnic",
      "walking-trail",
      "playground-equipment",
      "basketball",
      "exercise-equipment",
      "family-friendly",
    ],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5e5b70e67a7f3216d6cb4ef3/1631679599393/A.H+Capp+Reserve+excerpt+.jpg?format=1500w",
  },
  {
    name: "All Nations Park, Northcote",
    description:
      "All Nations Park in Northcote is a large regional reserve with two playgrounds, a dog park, lake, skate park, rocks and trees to climb, basketball half court, chess boards and a tennis/down ball wall. The 13-hectare park was created on the former Northcote landfill in 2002. The first playground suits little ones (slides, swings, climbing ladders, sandpit). The second playspace is more natural and for bigger kids (long wave slide, long curved tunnel slide, wooden and chain climbing wall, varied obstacles). Facilities noted: park benches, picnic tables, pram access, dogs off-leash, play spaces, public toilets, lots of shade, BBQs and parking. Mamma's special mention: Tinker cafe in Northcote for food.",
    location: {
      name: "All Nations Park",
      formattedAddress: "Separation St, Northcote, Melbourne, Australia",
      street_address: "Separation St",
      city: "Northcote",
      state_province: undefined,
      postal_code: undefined,
      country_code: "AU",
    },
    startDate: "2023-07-17T14:20:00+10:00",
    endDate: undefined,
    tags: ["park", "playground", "family", "dog-friendly", "skate park", "picnic"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5ad5d9960e2e72ed9a171b31/1689545184225/all+nations.jpg?format=1500w",
  },
  {
    name: "All Abilities Play Space and Splash Park, Mill Park",
    description:
      "Spacious, multi-zone all-abilities playspace with extensive water play (splash pads, mist ring tunnel, basins and troughs, shallow stream), wheelchair-accessible playground towers, sound installations, spiral tunnel slide, wide side-by-side slide, rock climbing wall, large double flying fox with accessible/adult chair, in-ground trampolines (including wheelchair-accessible trampoline), varied swing options, insect sculptures, toddlers' shaded structures, cubby house, chill-out area, dry creek bed, tree stumps and balance logs, native plant landscaping and a labyrinth. Facilities include toilets, picnic tables with cover, water refill station, BBQs, fully fenced areas, carpark and a basketball court. Suitable for all ages and abilities; bring swimmers, towels and snacks for summer water play.",
    location: {
      name: "Mill Park Recreation Reserve",
      formattedAddress:
        "Mill Park Recreation Reserve, 33 Morang Dr, Mill Park VIC 3082, AU",
      street_address: "33 Morang Dr",
      city: "Mill Park",
      state_province: "VIC",
      postal_code: "3082",
      country_code: "AU",
    },
    startDate: "2021-02-19T16:42:41+11:00",
    endDate: undefined,
    tags: ["park", "playground", "water play", "accessible", "family"],
    imageURL:
      "https://images.squarespace-cdn.com/content/v1/58813c79f7e0ab55271bb525/1732151994296-AJ9CBKCSTKY962I2MN70/mill+park+all+abilities+play+space-05.jpg?format=500w",
  },
  {
    name: "Allard Park playground and pump track, Brunswick East",
    description:
      "Allard Park in Brunswick East features a playground and a mini gravel pump track suitable for small or new riders. The pump track is a short loop with little hills and rubber tyres; it sits adjacent to the playground so kids can switch between riding and play. The playground includes 2 bike rockers, swings (including a nest swing), rainbow balancing logs, a merry-go-round, and a main play structure with monkey bars, a vertical rope climbing frame, rope tunnel, fireman's pole, shop front and two slides. Suitable for preschool and young primary children; older kids can use the nearby oval. Facilities: benches, picnic tables, drinking tap, toilets (behind the pavilion), and plenty of trees for shade.",
    location: {
      name: "Allard Park Pump Track",
      formattedAddress: "150 Mitchell St, Brunswick East, Melbourne, Australia",
      street_address: "150 Mitchell St",
      city: "Brunswick East",
      state_province: undefined,
      postal_code: undefined,
      country_code: "AU",
    },
    startDate: "2025-01-20",
    endDate: undefined,
    tags: ["park", "playground", "pump track", "bike track", "family", "picnic"],
    imageURL:
      "https://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/678da19d6ff41e1111a3880c/1745374381580/20250120_131813.jpg?format=1500w",
  },
  {
    name: "anderson reserve, coburg",
    description:
      "Anderson Reserve is a bright, recently upgraded, fully fenced toddler-friendly playground with a transport theme: simulated train tracks, trucks built from tyres and logs, bike and car rockers, tunnels, a bumpy grass 'road', toddler tower and slide, swings and an upright rainbow wind pipe for making music. There are also monkey bars, a mini rock climbing wall, a larger tower with slide and a balancing spring seesaw for older kids. Set in leafy surrounds with shady picnic spots, a basketball half court and off‑leash dog areas (away from the playground). Mamma's tip: the Post Office Hotel is just down the road for a family-friendly meal. The nitty gritty: fully fenced playground - basketball half court - drinking tap - park benches - grassy areas for picnics - dogs allowed off leash (away from playground) - easy surrounding street parking.",
    location: {
      name: "Anderson Reserve",
      formattedAddress: "44-46 Linda St, Coburg VIC 3058, AU",
      street_address: "44-46 Linda St",
      city: "Coburg",
      state_province: "VIC",
      postal_code: "3058",
      country_code: "AU",
    },
    startDate: "2020-06-07T13:51:46+1000",
    endDate: undefined,
    tags: [
      "park",
      "playground",
      "toddler-playground",
      "family-friendly",
      "fully-fenced",
      "nature-play",
    ],
    imageURL:
      "http://static1.squarespace.com/static/58813c79f7e0ab55271bb525/58ecb61820099e78e671de65/5edc6452c796372e5341478e/1730710090362/excerpt+anderson+reserve.jpg?format=1500w",
  },
];

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
    useMockScrape: v.optional(v.boolean()),
  },
  handler: async (_ctx, args): Promise<RawActivity[]> => {
    // If mock scrape is enabled, return the mock activities constant
    if (args.useMockScrape) {
      console.log(`[Mock] Using mock scrape data (${MOCK_ACTIVITIES.length} activities)`);
      return MOCK_ACTIVITIES;
    }

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
