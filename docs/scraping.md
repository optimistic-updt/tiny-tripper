# Scraping Pipeline

End-to-end flow for the website → activities ingestion pipeline.

## Triggers

- **Manual** — `scrapeWorkflow.startWebsiteScrapeWorkflow` mutation starts the workflow with a URL + config. This is the only entry point today.

## Workflow stages

`websiteScrapeWorkflow` (`convex/scrapeWorkflow.ts`) orchestrates the steps below. Each step writes intermediate artifacts to Convex storage and records the storage IDs on the `scrapeWorkflows` row via `workflowMetadata.updateWorkflowFile`.

```mermaid
flowchart TD
    Manual[["Manual:<br/>startWebsiteScrapeWorkflow"]] --> Start

    Start[["websiteScrapeWorkflow"]] --> CreateMeta[createWorkflowRecord<br/>→ scrapeWorkflows]
    CreateMeta --> Scrape[scrapeWebsiteAndStore]

    Scrape --> Mock{useMockScrape?}
    Mock -- yes --> MockData[return MOCK_ACTIVITIES_2]
    Mock -- no --> FetchFox[scrapeFetchFox<br/>FetchFox crawl]

    MockData --> RawStore
    FetchFox --> RawStore[(storage: rawActivities)]

    RawStore --> Empty{Activities found?}
    Empty -- no --> EarlyExit[complete with 0]
    Empty -- yes --> Standardize[standardizeActivities<br/>normalize fields]

    Standardize --> Parallel{{Parallel enrichment}}
    Parallel --> Images[processImagesAndStore]
    Parallel --> Geo[geocodeAddressesAndStore]
    Parallel --> EmbedSubmit[submitEmbeddingBatch]

    Images --> ImgStore[(storage: imagesMap)]
    Geo --> GeoStore[(storage: geocodedMap)]
    EmbedSubmit --> Poll[pollEmbeddingBatchAndStore<br/>retry: 150x, 60s backoff, base 1.5]
    Poll --> EmbStore[(storage: embeddingsMap)]

    ImgStore --> Merge
    GeoStore --> Merge
    EmbStore --> Merge

    Merge[mergeActivityDataAndStore] --> MergedStore[(storage: mergedActivities)]
    MergedStore --> Jsonl[generateAndStoreJsonL]
    Jsonl --> JsonlStore[(storage: finalJsonl)]

    JsonlStore --> AutoImport{config.autoImport?}
    AutoImport -- no --> CompleteManual[completeWorkflow<br/>JSONL retained for review]
    AutoImport -- yes --> Import[bulkImportActivitiesFromStorage<br/>dedupe by name + address]
    Import --> Activities[(db: activities)]
    Activities --> CompleteAuto[completeWorkflow<br/>+ importSummary]

    CompleteAuto --> Callback[handleWorkflowComplete]
    CompleteManual --> Callback
    EarlyExit --> Callback

    Callback --> CallbackKind{result.kind}
    CallbackKind -- success + autoImport --> Cleanup[cleanupWorkflowFiles<br/>delete intermediate storage]
    CallbackKind -- success + manual --> KeepFiles[keep storage files]
    CallbackKind -- error/canceled --> Fail[failWorkflow<br/>record error status]
```

## Storage targets

**Database tables**
- `scrapeWorkflows` — workflow metadata: status, intermediate file IDs, timings, import summary.
- `activities` — final destination, populated only when `autoImport === true`.

**Convex storage (intermediate JSON/JSONL artifacts; deleted only on autoImport success)**
- `rawActivities` — raw scraper output
- `imagesMap` — processed image URL map
- `geocodedMap` — address → coordinates
- `embeddingsMap` — embedding vectors
- `mergedActivities` — fully enriched activities
- `finalJsonl` — export-ready JSONL

**External services**
- FetchFox (web crawler / extractor)
- Embeddings batch API
- Geocoding API
- Image processing

## Error paths

- Invalid URL → throws before scraping starts, workflow fails.
- FetchFox scrape failure → throws, workflow fails.
- No activities extracted → early exit, workflow completes with count 0.
- Embedding batch not ready → retried up to 150 times with 60s initial backoff (base 1.5).
- Duplicate activity (name + address) → skipped during import, counted in summary.
- Import failure on a row → logged, summary records failure, workflow still completes.
- Workflow failure/cancel → `handleWorkflowComplete` schedules `failWorkflow` to record the error status.
- Storage cleanup failure → warning only, does not fail the workflow.

## Key entry points

- `convex/scrapeWorkflow.ts:49` — `websiteScrapeWorkflow` definition
- `convex/scrapeWorkflow.ts:369` — `startWebsiteScrapeWorkflow` mutation
- `convex/scrapeWorkflow.ts:404` — `handleWorkflowComplete` callback
- `convex/scraping.ts:5730` — `scrapeWebsiteAndStore` (FetchFox + mock branch)
