# Workflow Storage Optimization - Implementation Summary

## Problem
The scrape workflow was hitting Convex Workflow's 1MB size limit because:
- Embedding batches can exceed 1MB (text-embedding-3-small = 1536 dimensions × ~85+ activities)
- Images map, geocoded map could also potentially exceed limits with many activities
- Workflow steps can only pass max 1MB of data between steps

## Solution
Store large intermediate results in Convex Storage and pass storage IDs through the workflow instead of full data.

---

## Changes Made

### 1. **New Schema Table: `scrapeWorkflows`** (`convex/schema.ts`)
Added a metadata table to track workflow runs:
```typescript
scrapeWorkflows: defineTable({
  workflowId: v.string(),
  url: v.string(),
  status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
  startedAt: v.string(),
  completedAt: v.optional(v.string()),
  config: { /* workflow configuration */ },
  files: {
    rawActivities: v.optional(v.id("_storage")),
    imagesMap: v.optional(v.id("_storage")),
    geocodedMap: v.optional(v.id("_storage")),
    embeddingsMap: v.optional(v.id("_storage")),
    finalJsonl: v.optional(v.id("_storage")),
  },
  activitiesProcessed: v.optional(v.number()),
  importSummary: v.optional({ /* import stats */ }),
}).index("by_workflowId", ["workflowId"])
```

### 2. **New Helper Files**

#### `convex/storageHelpers.ts`
Generic helpers for storing/retrieving JSON data:
- `storeJsonData` - Store any JSON data to storage
- `retrieveJsonData` - Retrieve JSON data from storage

#### `convex/workflowMetadata.ts`
Workflow tracking and cleanup:
- `createWorkflowRecord` - Create workflow metadata on start
- `updateWorkflowFile` - Track storage IDs for each file type
- `completeWorkflow` - Mark workflow as complete with results
- `failWorkflow` - Mark workflow as failed
- `getWorkflowRecord` - Fetch workflow record
- `cleanupWorkflowFiles` - Delete all storage files for a workflow

### 3. **Updated Processing Functions**

#### `convex/scraping.ts`
- Added `scrapeWebsiteAndStore` - Wraps `scrapeWebsite` and stores results

#### `convex/imageProcessing.ts`
- Added `processImagesAndStore` - Process images and store map in storage

#### `convex/geocoding.ts`
- Added `geocodeAddressesAndStore` - Geocode addresses and store map in storage

#### `convex/embeddings.ts`
- Added `pollEmbeddingBatchAndStore` - Poll embeddings and store map in storage

#### `convex/formatting.ts`
- Added `mergeActivityDataFromStorage` - Fetches data from storage IDs and merges

### 4. **Main Workflow Changes** (`convex/scrapeWorkflow.ts`)

#### Updated Flow:
```
Step 0: Create workflow metadata record
Step 1: Scrape website → store raw activities → save storage ID
Step 2: Standardize activities (in-memory)
Step 3: Parallel processing (all return storage IDs):
  - 3a: Process images → store images map
  - 3b: Geocode addresses → store geocoded map  
  - 3c: Submit embedding batch → return batch ID
Step 3d: Poll embeddings → store embeddings map
Step 4: Merge data from storage IDs
Step 5: Generate and store final JSONL
Step 6: Conditionally import to DB (if autoImport=true)
Step 7: Mark workflow as complete
```

#### Workflow Completion Handler:
```typescript
export const handleWorkflowComplete = internalMutation({
  // Called via onComplete callback
  // - If autoImport=true && success: cleanup storage files
  // - If error or canceled: mark workflow as failed
  // - If autoImport=false: keep all files for review
})
```

### 5. **Cleanup Strategy**

#### Automatic Cleanup (when `autoImport=true`):
1. Workflow completes successfully
2. Activities imported to DB
3. `onComplete` callback triggers
4. All intermediate storage files deleted:
   - Raw activities JSON
   - Images map JSON
   - Geocoded map JSON
   - Embeddings map JSON
   - Final JSONL file

#### Manual Review (when `autoImport=false`):
1. Workflow completes successfully
2. `onComplete` callback sees `autoImport=false`
3. **All files kept in storage** for manual review
4. Files remain accessible via workflow metadata table
5. Can be manually imported or deleted later

---

## Benefits

### ✅ Scalability
- **No 1MB limit** - Can handle unlimited activities
- Each file stored separately in storage (no combined size limit)
- Storage is cheaper than keeping data in workflow journal

### ✅ Observability
- `scrapeWorkflows` table tracks all runs with timestamps
- Storage IDs logged for each processing step
- Can inspect intermediate results even after workflow completes
- Workflow status tracked (running/completed/failed)

### ✅ Data Retention
- **Conditional cleanup** based on `autoImport` flag
- Failed workflows keep all files for debugging
- Success + no-import keeps files for review
- Success + import cleans up automatically

### ✅ Debugging
- Each intermediate step stored separately
- Can download and inspect:
  - Raw scraped data
  - Image processing results
  - Geocoding results
  - Embeddings batch output
  - Final merged JSONL

---

## Usage

### Start a workflow:
```typescript
const workflowId = await ctx.runMutation(
  api.scrapeWorkflow.startWebsiteScrapeWorkflow,
  {
    url: "https://example.com",
    config: {
      maxPages: 150,
      autoImport: false, // Keep files for review
    },
  },
);
```

### Check workflow status:
```typescript
const workflow = await ctx.db
  .query("scrapeWorkflows")
  .withIndex("by_workflowId", (q) => q.eq("workflowId", workflowId))
  .first();

console.log(workflow.status); // "running" | "completed" | "failed"
console.log(workflow.files); // Storage IDs for all files
```

### Download intermediate files:
```typescript
// Get storage ID from workflow record
const storageId = workflow.files.rawActivities;

// Download file
const url = await ctx.storage.getUrl(storageId);
// Fetch and process the JSON data
```

---

## File Sizes (Reference)

| Data Type | Approximate Size (100 activities) |
|-----------|-----------------------------------|
| Raw Activities | ~100-200 KB |
| Images Map | ~10-20 KB (just storage IDs) |
| Geocoded Map | ~50-100 KB |
| Embeddings Map | **~1.8 MB** ⚠️ (1536 dims × 100) |
| Final JSONL | ~2-3 MB |

With 100 activities, embeddings alone exceed the 1MB workflow limit. With this solution, each is stored separately with no size constraints.

---

## Error Handling

### Workflow Failures:
1. Error thrown in any step
2. Workflow status = "failed"
3. `onComplete` callback called with error
4. `failWorkflow` mutation marks record as failed
5. All files **kept in storage** for debugging

### Storage Failures:
- Non-critical - workflow continues
- Errors logged but don't fail entire pipeline
- Missing data handled gracefully in merge step

---

## Future Enhancements

### Possible improvements:
1. **TTL for storage files** - Auto-delete after X days
2. **Storage file metadata** - Track file sizes, creation time
3. **Download URLs in API** - Provide pre-signed URLs for file downloads
4. **Workflow retry** - Re-run from failed step using stored data
5. **Diff comparison** - Compare new scrape with previous runs
6. **Batch cleanup** - Bulk delete old workflow files
