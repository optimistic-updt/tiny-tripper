# ADR 0001 — Change tracking: two-tier orchestration with pluggable detectors

- **Status**: Accepted
- **Date**: 2026-05-07

## Context

We need to keep `activities` fresh as our scraping sources (`mammaknowsmelbourne.com.au`, `timeout.com/melbourne/kids`, `whatson.melbourne.vic.gov.au`, etc.) publish new content. The existing `websiteScrapeWorkflow` does a deep crawl — extract → geocode → embed → import — which is expensive and not appropriate to run on a schedule against every source just to discover whether anything is new.

Constraints we audited up-front:

- The three target sources don't all expose the same metadata. We probed each:
  - mamma — `sitemap.xml` with per-URL `<lastmod>`; no RSS.
  - timeout — sitemap-index of 14 shards, per-URL `<lastmod>`, `/kids` paths sprinkled across shards; no RSS link tags; the advertised `news_sitemap.xml` is Google-News-spec (last 48h only) and too narrow.
  - whatson — `sitemap.xml.gz` returns 200 with `content-length: 0`; `/sitemap.xml` and `/sitemap_index.xml` 404; no feed link tags.
- A single detection mechanism would force us to either (a) re-crawl every site every tick (wasteful) or (b) only support the lowest common denominator (whatever whatson allows, i.e. firecrawl).
- The full scrape workflow already exists and works; we want change tracking to *feed it*, not replace it.

## Decision

**Two-tier orchestration** with **pluggable per-source detectors**:

1. **Tier 1 — index check** (cheap, hourly cron). For each due source, the configured detector returns the set of URLs that are new or updated since last check. Detector kinds:
   - `sitemap` — fetch and recursively walk a sitemap (handles `<sitemapindex>` and `.gz`); optional `pathIncludes` / `pathExcludes` filter; diff by URL + `<lastmod>`.
   - `rss` — parse an RSS/Atom feed; diff by `pubDate`. *(stub)*
   - `firecrawl-change` — Firecrawl's `changeTracking` feature in `json` mode against a schema describing items on the listing page; diff returned by Firecrawl. *(stub)*
2. **Tier 2 — detail scrape** (expensive, on hits). For each new/updated URL, schedule `startSingleScrape` (the existing `websiteScrapeWorkflow` with `maxCrawlVisit=1, maxDepth=0`).

The detector kind is a Convex discriminated union on the `scrapingSources` row. Per-URL state lives in a sibling `scrapingSourceItems` table (`by_source_and_url` index), serving as both the audit log and the "seen set" the detector diffs against.

Detection priority when onboarding a new source: RSS → sitemap → firecrawl-change. Codified in `docs/change-tracking.md`.

## Alternatives considered

- **Single mechanism: firecrawl change tracking on every source.** Rejected. Charges a scrape credit per check per source. Ties Tier 1 to one vendor. Wastes the free, reliable per-URL `<lastmod>` signal sites already publish.
- **Single mechanism: whole-page hash-and-diff via cron.** Rejected. Tells us *something* changed but not *what*; we'd still have to crawl the listing to find the new article URL. Strictly worse than parsing the URL list ourselves.
- **CSS-selector scraper per site for Tier 1.** Rejected as the default. More flexible than any of the above, but maintenance cost is high — selectors break on redesigns. Reserve as a last-resort detector we add only if RSS/sitemap/firecrawl all fail.
- **`type` taxonomy on `scrapingSources` (`website`/`social_media`/`other`).** Dropped from the original schema scaffold. The `detector.kind` already discriminates by *how* to detect; the source type is at best display metadata and adds no behavior.
- **Inline `seenUrls` array on the source row.** Rejected. Timeout's full sitemap is ~14k URLs — would bloat the source document past sensible size. Sibling `scrapingSourceItems` table scales and gives us per-URL audit trail for free.
- **Triggering the full `websiteScrapeWorkflow` per new URL.** Considered but unnecessary — `startSingleScrape` already exists and is the right entry point. We pass through `scraper` and `tagsHint` from `detailScrapeOptions` on the source row.

## Consequences

**Positive**

- Cheap detection: an hourly cron against mamma is one HTTP fetch + a small XML parse; against timeout it's 14 small gzipped fetches (CloudFront-cached). Detail scrape only runs on actual hits.
- Adding a new source is a config-only change once a detector kind covers it. The `docs/change-tracking.md` checklist makes the per-site decision deterministic.
- `scrapingSourceItems` doubles as a provenance log — every imported `activity.sourceUrl` ties back to the row that discovered it and the workflow that scraped it.
- The detector union is open for extension. A future `css-selector` or `json-api` detector slots into the existing dispatcher without changing the tier model.

**Negative / accepted trade-offs**

- `firecrawl-change` detects only genuinely new URLs, not content updates to an already-seen URL (Firecrawl items carry no per-item `lastmod`). Acceptable: for a listing page, "new entry" is the signal we care about.
- The `rss` detector is implemented but not yet exercised against a live source — none of our three current sources expose a usable feed.
- New runtime dependency: `fast-xml-parser` (small, no transitives).
- `changeTracking.ts` runs in Node (`"use node"`) because `zlib.gunzipSync` isn't available in the V8 isolate.
- Sitemap detection depends on sites maintaining accurate `<lastmod>` values. If a site bumps `lastmod` on every nightly republish, we'd re-scrape unchanged content. Mitigation deferred — we'll watch detail-scrape volume and add a content-hash check if it becomes an issue.
- Sources with `interval: "manual"` never auto-tick; they're triggered out-of-band. By design, but worth being explicit about.

## Implementation references

- Schema: [`convex/schema.ts`](../../convex/schema.ts) — `scrapingSources` (with `detector` union) + `scrapingSourceItems`.
- Tier 1: [`convex/changeTracking.ts`](../../convex/changeTracking.ts) — `tick`, `detectChanges`, sitemap walker.
- Tier 2 entry: `convex/scrapeWorkflow.ts` → `startSingleScrape`.
- Cron: [`convex/crons.ts`](../../convex/crons.ts) — hourly tick.
- Onboarding checklist: [`docs/change-tracking.md`](../change-tracking.md).
