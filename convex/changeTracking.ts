"use node";

import { gunzipSync } from "node:zlib";
import { XMLParser } from "fast-xml-parser";
import { Firecrawl } from "@mendable/firecrawl-js";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { env } from "./env";

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

type Source = Doc<"scrapingSources">;
type SeenItem = Doc<"scrapingSourceItems">;
type Discovered = { url: string; lastmod?: string; contentHash?: string };

type DetectionResult = {
  newUrls: Discovered[];
  updatedUrls: Discovered[];
};

// -------------------------------------------------------------------------
// Cron tick — schedules detection for every active, due source
// -------------------------------------------------------------------------

export const tick = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const due = (await ctx.runQuery(internal.scrapingSources.listDue, {
      now,
    })) as Source[];

    for (const source of due) {
      await ctx.scheduler.runAfter(
        0,
        internal.changeTracking.detectChanges,
        { sourceId: source._id },
      );
    }
    return null;
  },
});

// -------------------------------------------------------------------------
// Dispatcher — runs the right detector, persists items, schedules Tier 2
// -------------------------------------------------------------------------

export const detectChanges = internalAction({
  args: { sourceId: v.id("scrapingSources") },
  returns: v.object({
    newCount: v.number(),
    updatedCount: v.number(),
  }),
  handler: async (ctx, { sourceId }) => {
    const source = (await ctx.runQuery(internal.scrapingSources.get, {
      sourceId,
    })) as Source | null;
    if (!source) throw new Error(`source ${sourceId} not found`);

    const seenRows = (await ctx.runQuery(
      internal.scrapingSourceItems.listBySource,
      { sourceId },
    )) as SeenItem[];
    const seen = new Map(seenRows.map((r) => [r.url, r] as const));

    let result: DetectionResult;
    switch (source.detector.kind) {
      case "sitemap":
        result = await detectViaSitemap(source.detector, seen);
        break;
      case "rss":
        result = await detectViaRss(source.detector, seen);
        break;
      case "firecrawl-change":
        result = await detectViaFirecrawl(source.detector, seen);
        break;
    }

    const now = Date.now();
    const allDiscovered = [...result.newUrls, ...result.updatedUrls];

    // Persist seen-set updates (new rows + bump lastSeenAt on existing).
    if (allDiscovered.length > 0) {
      await ctx.runMutation(internal.scrapingSourceItems.upsertBatch, {
        sourceId,
        items: allDiscovered,
        now,
      });
    }

    // Bookkeeping — always bump lastCheckedAt; bump lastChangeAt iff changes.
    await ctx.runMutation(internal.scrapingSources.markChecked, {
      sourceId,
      checkedAt: now,
      changed: allDiscovered.length > 0,
    });

    // Tier 2 dispatch — fire off a single-URL scrape per discovered item.
    for (const item of allDiscovered) {
      const workflowId = (await ctx.runMutation(
        api.scrapeWorkflow.startSingleScrape,
        {
          url: item.url,
          scraper: source.detailScrapeOptions?.scraper,
          tagsHint: source.detailScrapeOptions?.tagsHint,
          workflowConfig: { autoImport: true },
          source: { sourceId, url: item.url },
        },
      )) as string;

      await ctx.runMutation(internal.scrapingSourceItems.markQueued, {
        sourceId,
        url: item.url,
        detailWorkflowId: workflowId,
      });
    }

    return {
      newCount: result.newUrls.length,
      updatedCount: result.updatedUrls.length,
    };
  },
});

// -------------------------------------------------------------------------
// RSS / Atom detector
// -------------------------------------------------------------------------

type RssDetector = Extract<Source["detector"], { kind: "rss" }>;

async function detectViaRss(
  detector: RssDetector,
  seen: Map<string, SeenItem>,
): Promise<DetectionResult> {
  const entries = await fetchFeedEntries(detector.feedUrl);

  const newUrls: Discovered[] = [];
  const updatedUrls: Discovered[] = [];
  for (const e of entries) {
    if (!e.url) continue;
    const prior = seen.get(e.url);
    if (!prior) {
      newUrls.push({ url: e.url, lastmod: e.lastmod });
    } else if (e.lastmod && prior.lastmod !== e.lastmod) {
      updatedUrls.push({ url: e.url, lastmod: e.lastmod });
    }
  }

  return { newUrls, updatedUrls };
}

type FeedEntry = { url?: string; lastmod?: string };

/**
 * Parses both RSS 2.0 (`<rss><channel><item>`) and Atom (`<feed><entry>`).
 * Attributes are kept because Atom links carry the URL in `href`.
 */
async function fetchFeedEntries(feedUrl: string): Promise<FeedEntry[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "TinyTripperBot/1.0 (+change-tracking)" },
  });
  if (!res.ok) {
    throw new Error(`feed fetch failed: ${feedUrl} → HTTP ${res.status}`);
  }
  const body = await res.text();

  type RssItem = { link?: string; pubDate?: string; "dc:date"?: string };
  type AtomEntry = {
    link?: AtomLink | AtomLink[];
    updated?: string;
    published?: string;
  };

  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(body) as {
    rss?: { channel?: { item?: RssItem | RssItem[] } };
    feed?: { entry?: AtomEntry | AtomEntry[] };
  };

  // RSS 2.0
  if (parsed.rss?.channel) {
    return arr(parsed.rss.channel.item).map((item) => ({
      url: typeof item.link === "string" ? item.link : undefined,
      lastmod: item.pubDate ?? item["dc:date"],
    }));
  }

  // Atom
  if (parsed.feed) {
    return arr(parsed.feed.entry).map((entry) => ({
      url: pickAtomLink(entry.link),
      lastmod: entry.updated ?? entry.published,
    }));
  }

  return [];
}

type AtomLink = { "@_href"?: string; "@_rel"?: string };

/** Atom entries can carry multiple <link>s; prefer rel="alternate". */
function pickAtomLink(link: AtomLink | AtomLink[] | undefined): string | undefined {
  const links = arr(link);
  if (links.length === 0) return undefined;
  const alternate = links.find((l) => l["@_rel"] === "alternate" || !l["@_rel"]);
  return (alternate ?? links[0])["@_href"];
}

// -------------------------------------------------------------------------
// Firecrawl change-tracking detector
// -------------------------------------------------------------------------

type FirecrawlDetector = Extract<
  Source["detector"],
  { kind: "firecrawl-change" }
>;

/**
 * Scrapes the listing page once with Firecrawl's `changeTracking` + `json`
 * formats. Firecrawl maintains its own previous snapshot, but we diff the
 * *current* item list against our own seen set — that's the source of truth
 * for what we've already scraped, and it stays correct even if Firecrawl's
 * snapshot is reset. The configured schema describes an `items` array.
 */
async function detectViaFirecrawl(
  detector: FirecrawlDetector,
  seen: Map<string, SeenItem>,
): Promise<DetectionResult> {
  const itemsSchema = JSON.parse(detector.schemaJson) as Record<
    string,
    unknown
  >;

  const firecrawl = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });

  const doc = (await firecrawl.scrape(detector.listingUrl, {
    // markdown is required: changeTracking compares pages via their markdown.
    formats: [
      "markdown",
      { type: "json", schema: itemsSchema },
      { type: "changeTracking", modes: ["json"], schema: itemsSchema },
    ],
  })) as {
    json?: { items?: Array<{ url?: string; title?: string }> };
    changeTracking?: {
      json?: { items?: { current?: Array<{ url?: string }> } };
    };
  };

  // Prefer the change-tracking "current" list; fall back to the plain json
  // extraction if change tracking didn't populate (e.g. first ever scrape).
  const currentItems =
    doc.changeTracking?.json?.items?.current ?? doc.json?.items ?? [];

  const newUrls: Discovered[] = [];
  for (const item of currentItems) {
    if (!item.url) continue;
    if (!seen.has(item.url)) {
      newUrls.push({ url: item.url });
    }
  }

  // Firecrawl items carry no per-item lastmod, so we can't detect content
  // updates to an already-seen URL here — only genuinely new URLs.
  return { newUrls, updatedUrls: [] };
}

// -------------------------------------------------------------------------
// Sitemap detector
// -------------------------------------------------------------------------

type SitemapDetector = Extract<Source["detector"], { kind: "sitemap" }>;

async function detectViaSitemap(
  detector: SitemapDetector,
  seen: Map<string, SeenItem>,
): Promise<DetectionResult> {
  const urls = await walkSitemap(detector.sitemapUrl);

  const filtered = urls.filter((u) => {
    if (detector.pathIncludes && !u.loc.includes(detector.pathIncludes)) {
      return false;
    }
    if (
      detector.pathExcludes &&
      detector.pathExcludes.some((p) => u.loc.includes(p))
    ) {
      return false;
    }
    return true;
  });

  const newUrls: Discovered[] = [];
  const updatedUrls: Discovered[] = [];
  for (const u of filtered) {
    const prior = seen.get(u.loc);
    if (!prior) {
      newUrls.push({ url: u.loc, lastmod: u.lastmod });
    } else if (u.lastmod && prior.lastmod !== u.lastmod) {
      updatedUrls.push({ url: u.loc, lastmod: u.lastmod });
    }
  }

  return { newUrls, updatedUrls };
}

type SitemapEntry = { loc: string; lastmod?: string };

/**
 * Walks a sitemap URL recursively:
 * - `<sitemapindex>` → fetches each child sitemap and concatenates results.
 * - `<urlset>` → returns the leaf entries.
 *
 * Transparently handles `.gz` and the whatson.melbourne.vic.gov.au quirk
 * where the server returns 200 with an empty body.
 */
async function walkSitemap(url: string): Promise<SitemapEntry[]> {
  const body = await fetchSitemapBody(url);
  if (!body) return [];

  // fast-xml-parser leaves single-child elements as objects, multi-child as
  // arrays — `arr()` normalizes that ambiguity.
  const parser = new XMLParser({ ignoreAttributes: true });
  const parsed = parser.parse(body) as {
    sitemapindex?: {
      sitemap?: { loc: string } | { loc: string }[];
    };
    urlset?: {
      url?:
        | { loc: string; lastmod?: string }
        | { loc: string; lastmod?: string }[];
    };
  };

  if (parsed.sitemapindex) {
    const entries = arr(parsed.sitemapindex.sitemap);
    const nested = await Promise.all(entries.map((e) => walkSitemap(e.loc)));
    return nested.flat();
  }

  if (parsed.urlset) {
    return arr(parsed.urlset.url).map((u) => ({
      loc: u.loc,
      lastmod: u.lastmod,
    }));
  }

  return [];
}

async function fetchSitemapBody(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": "TinyTripperBot/1.0 (+change-tracking)" },
  });
  if (!res.ok) {
    throw new Error(`sitemap fetch failed: ${url} → HTTP ${res.status}`);
  }

  const isGz =
    url.endsWith(".gz") ||
    res.headers.get("content-type")?.includes("gzip") === true;

  if (isGz) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) {
      // e.g. whatson.melbourne.vic.gov.au — 200 OK but empty body.
      console.warn(`sitemap ${url} returned empty body, skipping`);
      return null;
    }
    return gunzipSync(buf).toString("utf8");
  }

  return await res.text();
}

function arr<T>(x: T | T[] | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}
