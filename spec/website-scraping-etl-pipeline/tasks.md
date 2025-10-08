# Tasks: Website Scraping ETL Pipeline

## Task 1: Environment Setup and Dependencies

_Requirements: 10_

**Status**: completed

**Dependencies**: None

**Description**: Install required dependencies and configure environment variables for Firecrawl API integration.

### Tests to Write First (TDD - Red)
- Unit test: Verify `FIRECRAWL_API_KEY` is loaded from environment in `convex/env.ts`
- Unit test: Verify environment schema validation fails with missing/invalid API key

### Implementation (TDD - Green)
1. Install Firecrawl SDK:
   ```bash
   npm install @mendable/firecrawl-js
   ```

2. Update `convex/env.ts` to include `FIRECRAWL_API_KEY`:
   ```typescript
   export const env = createEnv({
     server: {
       // ... existing vars
       FIRECRAWL_API_KEY: z.string().min(1),
     },
     // ... rest
   });
   ```

3. Add to `.env.local`:
   ```
   FIRECRAWL_API_KEY=your_api_key_here
   ```

4. Update `.env.example` with placeholder for documentation

### Refactoring Notes
- None required for this task

### Acceptance Criteria
- `@mendable/firecrawl-js` appears in `package.json` dependencies
- `convex/env.ts` exports `FIRECRAWL_API_KEY` with validation
- Environment variable schema validation passes with valid key
- Environment variable schema validation fails with missing key

---

## Task 2: Implement Scraping Module (Step 1)

_Requirements: 2, 10_

**Status**: completed

**Dependencies**: Task 1

**Description**: Implement Firecrawl integration to scrape websites and extract rough activity data using LLM-based extraction.

### Tests to Write First (TDD - Red)
- Unit test: Mock Firecrawl API response and verify activity extraction
- Unit test: Verify URL parameter is passed correctly to Firecrawl
- Unit test: Verify `maxDepth` and `maxPages` config are applied
- Integration test: Test with sample HTML returning expected activity structure
- Error test: Handle Firecrawl API errors gracefully

### Implementation (TDD - Green)
1. Create `convex/scraping.ts`
2. Implement `scrapeWebsite` internal action:
   ```typescript
   export const scrapeWebsite = action({
     args: {
       url: v.string(),
       maxDepth: v.optional(v.number()),
       maxPages: v.optional(v.number()),
     },
     handler: async (ctx, args) => {
       // Initialize Firecrawl client
       // Configure crawl with LLM extraction prompt
       // Execute crawl
       // Parse and return raw activities
     }
   });
   ```

3. Configure LLM extraction prompt to target all required fields:
   - name, description, location (with all subfields)
   - startDate, endDate, tags, imageURL

4. Implement error handling and retry logic for network failures

### Refactoring Notes
- Extract extraction prompt to constant for reusability
- Consider splitting large page parsing into helper functions

### Acceptance Criteria
- `scrapeWebsite` action accepts URL and config parameters
- Returns array of raw activity objects with expected fields
- Handles malformed URLs with clear error messages
- Respects `maxDepth` and `maxPages` limits
- Logs scraping errors without crashing

---

## Task 3: Implement Data Standardization (Step 2)

_Requirements: 3_

**Status**: completed

**Dependencies**: Task 2

**Description**: Transform rough scraping results into standardized schema with validation and defaults.

### Tests to Write First (TDD - Red)
- Unit test: Activity with all fields formats correctly
- Unit test: Activity with missing optional fields gets defaults (`urgency: "medium"`, `isPublic: true`)
- Unit test: Activity without `name` is skipped with warning log
- Unit test: Tags are deduplicated and normalized (lowercase, trimmed)
- Unit test: Invalid date strings are caught and set to undefined
- Unit test: Location data preserves all available subfields

### Implementation (TDD - Green)
1. Create `convex/formatting.ts`
2. Implement `standardizeActivities` internal mutation:
   ```typescript
   export const standardizeActivities = internalMutation({
     args: {
       rawActivities: v.array(v.any()),
       config: v.object({
         urgencyDefault: v.optional(v.union(
           v.literal("low"),
           v.literal("medium"),
           v.literal("high")
         )),
         isPublic: v.optional(v.boolean()),
       }),
     },
     handler: async (ctx, args) => {
       // Validate and transform each activity
       // Apply defaults
       // Normalize tags
       // Validate dates
       // Skip invalid activities
     }
   });
   ```

3. Implement validation logic:
   - Required: `name` (string, non-empty)
   - Defaults: `urgency` = "medium", `isPublic` = true
   - Tag normalization: deduplicate, lowercase, trim
   - Date validation: ISO 8601 format check

### Refactoring Notes
- Extract date validation to helper function
- Extract tag normalization to helper function
- Consider using Zod schema for validation

### Acceptance Criteria
- Activities with all fields pass through correctly
- Missing `urgency` defaults to "medium"
- Missing `isPublic` defaults to true
- Activities without `name` are filtered out with console warning
- Tags are deduplicated and normalized
- Invalid dates are set to undefined with warning
- Location data structure matches schema requirements

---

## Task 4: Implement Image Processing (Step 3a)

_Requirements: 4_

**Status**: completed

**Dependencies**: Task 3

**Description**: Download images from URLs and upload to Convex storage, returning storage IDs.

### Tests to Write First (TDD - Red)
- Unit test: Mock fetch for valid image URL returns storage ID
- Unit test: Invalid image URL logs error and continues without crash
- Unit test: Network timeout is handled gracefully
- Unit test: Non-image content type is rejected
- Integration test: Actual image upload to Convex storage (test environment)

### Implementation (TDD - Green)
1. Create `convex/imageProcessing.ts`
2. Implement `processImages` internal action:
   ```typescript
   export const processImages = action({
     args: {
       activities: v.array(v.any()),
     },
     handler: async (ctx, args) => {
       const imageMap: Record<number, Id<"_storage">> = {};

       for (let i = 0; i < args.activities.length; i++) {
         const activity = args.activities[i];
         if (!activity.imageURL) continue;

         try {
           // Fetch image with timeout
           // Validate content type
           // Upload to ctx.storage
           // Store mapping
         } catch (error) {
           // Log and continue
         }
       }

       return imageMap;
     }
   });
   ```

3. Add timeout for fetch requests (30 seconds)
4. Validate content-type is image/*
5. Handle blob conversion and storage upload

### Refactoring Notes
- Extract image validation to helper function
- Consider adding image size limits

### Acceptance Criteria
- Successfully downloads and stores valid images
- Returns map of activity index to storage ID
- Skips activities without `imageURL`
- Handles fetch errors without crashing
- Handles timeout errors gracefully
- Validates image content type before upload
- Logs failures with activity index for debugging

---

## Task 5: Implement Geocoding (Step 3b)

_Requirements: 5_

**Status**: completed

**Dependencies**: Task 3

**Description**: Convert address strings to coordinates and structured location data using Google Maps Geocoding API.

### Tests to Write First (TDD - Red)
- Unit test: Mock Google Maps API response and verify coordinate extraction
- Unit test: Extract structured address components correctly
- Unit test: Handle geocoding failures gracefully
- Unit test: Skip activities without location data
- Integration test: Real geocoding API call (test with known address)

### Implementation (TDD - Green)
1. Create `convex/geocoding.ts`
2. Implement `geocodeAddresses` internal action:
   ```typescript
   export const geocodeAddresses = action({
     args: {
       activities: v.array(v.any()),
     },
     handler: async (ctx, args) => {
       const geocodedMap: Record<number, {
         latitude: number;
         longitude: number;
         placeId: string;
         formattedAddress: string;
         street_address?: string;
         city?: string;
         state_province?: string;
         postal_code?: string;
         country_code?: string;
       }> = {};

       for (let i = 0; i < args.activities.length; i++) {
         // Skip if no location
         // Call Google Maps Geocoding API
         // Parse address components
         // Store mapping
       }

       return geocodedMap;
     }
   });
   ```

3. Implement address component parsing:
   - street_address: `street_number` + `route`
   - city: `locality` or `postal_town`
   - state_province: `administrative_area_level_1`
   - postal_code: `postal_code`
   - country_code: `country` (short_name)

4. Add retry logic for rate limit errors (exponential backoff)

### Refactoring Notes
- Extract address component parser to helper function
- Consider batching requests if Google Maps supports it

### Acceptance Criteria
- Returns geocoded data for valid addresses
- Extracts latitude, longitude, and placeId
- Parses structured address components correctly
- Handles geocoding API errors without crashing
- Skips activities without location data
- Logs failures with activity index
- Implements retry logic for rate limits

---

## Task 6: Implement Embedding Generation (Step 3c)

_Requirements: 6_

**Status**: completed

**Dependencies**: Task 3

**Description**: Generate text embeddings using OpenAI Batch API and implement polling for batch completion.

### Tests to Write First (TDD - Red)
- Unit test: Verify batch request format matches OpenAI spec
- Unit test: Verify embedding input text is concatenated correctly
- Unit test: Mock batch submission returns batch ID
- Unit test: Mock batch retrieval with "completed" status returns embeddings
- Unit test: Mock batch retrieval with "in_progress" status returns null embeddings
- Integration test: Real batch submission and polling (may take time)

### Implementation (TDD - Green)
1. Create `convex/embeddings.ts`
2. Implement `generateEmbeddings` internal action:
   ```typescript
   export const generateEmbeddings = action({
     args: { activities: v.array(v.any()) },
     handler: async (ctx, args) => {
       const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

       // Prepare batch requests
       const batchRequests = args.activities.map((activity, i) => ({
         custom_id: `request-${i}`,
         method: "POST",
         url: "/v1/embeddings",
         body: {
           model: "text-embedding-3-small",
           input: [
             activity.name,
             activity.description || "",
             activity.location?.name || "",
             activity.location?.formattedAddress || "",
             ...(activity.tags || [])
           ].join(" "),
           encoding_format: "float",
         },
       }));

       // Create batch file and submit
       // Return batch ID
     }
   });
   ```

3. Implement `retrieveBatchEmbeddings` internal action:
   ```typescript
   export const retrieveBatchEmbeddings = action({
     args: { batchId: v.string() },
     handler: async (ctx, args) => {
       // Retrieve batch status
       // If completed, download and parse results
       // Return embeddings map or status
     }
   });
   ```

4. Handle batch status: "in_progress", "completed", "failed", "expired", "cancelled"
5. Parse batch output and map embeddings to activity indices

### Refactoring Notes
- Extract batch request formatting to helper
- Consider adding embedding dimension validation (1536 for text-embedding-3-small)

### Acceptance Criteria
- `generateEmbeddings` submits batch and returns batch ID
- Batch requests use correct format and model
- Embedding input concatenates all text fields
- `retrieveBatchEmbeddings` returns status and embeddings
- Handles "completed" status with embedding data
- Handles "in_progress" status with null embeddings
- Handles "failed" status with error message
- Parses batch output correctly into embeddings map

---

## Task 7: Implement Data Merging (Step 4)

_Requirements: 7_

**Status**: pending

**Dependencies**: Task 4, Task 5, Task 6

**Description**: Merge standardized activities with processed images, geocoded locations, and embeddings into complete activity records.

### Tests to Write First (TDD - Red)
- Unit test: Merge all data sources correctly
- Unit test: Activity without image keeps undefined imageId
- Unit test: Activity without geocoding keeps undefined coordinates
- Unit test: Activity without embedding keeps undefined embedding
- Unit test: Final schema matches activities table structure

### Implementation (TDD - Green)
1. Add to `convex/formatting.ts`
2. Implement `mergeActivityData` internal mutation:
   ```typescript
   export const mergeActivityData = internalMutation({
     args: {
       activities: v.array(v.any()),
       images: v.any(), // Record<number, Id<"_storage">>
       geocoded: v.any(), // Record<number, GeocodedLocation>
       embeddings: v.any(), // Record<number, number[]>
     },
     handler: async (ctx, args) => {
       return args.activities.map((activity, i) => {
         const merged = { ...activity };

         // Merge image storage ID
         if (args.images[i]) {
           merged.imageId = args.images[i];
         }
         delete merged.imageURL; // Remove raw URL

         // Merge geocoded data
         if (args.geocoded[i]) {
           merged.location = {
             ...merged.location,
             ...args.geocoded[i],
           };
         }

         // Merge embedding
         if (args.embeddings[i]) {
           merged.embedding = args.embeddings[i];
         }

         return merged;
       });
     }
   });
   ```

### Refactoring Notes
- Consider validating final schema with Zod
- Ensure `imageURL` is removed from final output

### Acceptance Criteria
- Merges all data sources into single activity objects
- Preserves all original standardized fields
- Adds `imageId` from image processing
- Adds geocoding data to location object
- Adds embedding vector
- Removes `imageURL` field from final output
- Final objects conform to activities table schema

---

## Task 8: Implement Database Import (Step 5a)

_Requirements: 8_

**Status**: pending

**Dependencies**: Task 7

**Description**: Import complete activity records into the database using existing mutations, with deduplication.

### Tests to Write First (TDD - Red)
- Unit test: Successfully imports activities using `createActivityDocument`
- Unit test: Updates geospatial index for activities with coordinates
- Unit test: Handles duplicate detection (same name + location)
- Unit test: Returns import summary with counts
- Integration test: Import real activities to test database

### Implementation (TDD - Green)
1. Create `convex/importing.ts`
2. Implement `bulkImportActivities` internal mutation:
   ```typescript
   export const bulkImportActivities = internalMutation({
     args: {
       activities: v.array(v.any()),
     },
     handler: async (ctx, args) => {
       const summary = {
         imported: 0,
         skipped: 0,
         failed: 0,
         errors: [] as string[],
       };

       for (const activity of args.activities) {
         try {
           // Check for duplicate (name + location match)
           const existing = await ctx.db
             .query("activities")
             .filter((q) => q.eq(q.field("name"), activity.name))
             .first();

           if (existing &&
               existing.location?.formattedAddress ===
               activity.location?.formattedAddress) {
             summary.skipped++;
             continue;
           }

           // Import using createActivityDocument
           await ctx.runMutation(
             internal.activities.createActivityDocument,
             activity
           );
           summary.imported++;
         } catch (error) {
           summary.failed++;
           summary.errors.push(`Failed to import ${activity.name}: ${error}`);
         }
       }

       return summary;
     }
   });
   ```

3. Implement duplicate detection logic (name + formattedAddress match)
4. Use existing `createActivityDocument` mutation for consistency

### Refactoring Notes
- Consider making deduplication strategy configurable
- Consider batch insert optimization if performance is slow

### Acceptance Criteria
- Imports activities using `createActivityDocument` mutation
- Detects duplicates by name and location
- Skips duplicate activities
- Returns summary with imported/skipped/failed counts
- Logs errors for failed imports
- Geospatial indices are updated automatically by existing mutation

---

## Task 9: Implement JSON-L File Generation (Step 5b)

_Requirements: 7, 8_

**Status**: pending

**Dependencies**: Task 7

**Description**: Generate JSON-L formatted output file for manual import or external processing.

### Tests to Write First (TDD - Red)
- Unit test: Converts activity array to JSON-L format (one object per line)
- Unit test: Each line is valid JSON
- Unit test: File content matches expected format
- Unit test: Empty activity array produces empty file

### Implementation (TDD - Green)
1. Add to `convex/importing.ts`
2. Implement `generateJsonL` internal action:
   ```typescript
   export const generateJsonL = action({
     args: {
       activities: v.array(v.any()),
     },
     handler: async (ctx, args) => {
       // Convert to JSON-L format
       const jsonlContent = args.activities
         .map(activity => JSON.stringify(activity))
         .join("\n");

       // Store in Convex storage
       const blob = new Blob([jsonlContent], { type: "application/jsonl" });
       const storageId = await ctx.storage.store(blob);

       // Generate URL for download
       const url = await ctx.storage.getUrl(storageId);

       return {
         storageId,
         url,
         activityCount: args.activities.length,
       };
     }
   });
   ```

### Refactoring Notes
- Consider adding metadata header with timestamp and source URL
- Consider compression for large files

### Acceptance Criteria
- Generates valid JSON-L format (one JSON object per line)
- Stores file in Convex storage
- Returns storage ID and download URL
- File can be parsed line-by-line as JSON
- Empty input produces empty file

---

## Task 10: Implement Workflow Orchestration

_Requirements: 1, 9, 10_

**Status**: pending

**Dependencies**: Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8, Task 9

**Description**: Orchestrate all pipeline steps using Convex Workflow with transaction guarantees and durable polling.

### Tests to Write First (TDD - Red)
- Unit test: Workflow validates config parameters
- Unit test: Workflow executes steps in correct order
- Integration test: Mock all steps and verify workflow completion
- Integration test: Test embedding polling logic with mock batch status
- Integration test: Test workflow failure handling

### Implementation (TDD - Green)
1. Update `convex/scrapeWorkflow.ts`
2. Implement `websiteScrapeWorkflow`:
   ```typescript
   export const websiteScrapeWorkflow = workflow.define({
     args: {
       url: v.string(),
       config: v.optional(v.object({
         maxDepth: v.optional(v.number()),
         maxPages: v.optional(v.number()),
         autoImport: v.optional(v.boolean()),
         urgencyDefault: v.optional(v.union(
           v.literal("low"),
           v.literal("medium"),
           v.literal("high")
         )),
         isPublic: v.optional(v.boolean()),
       })),
     },
     handler: async (step, args) => {
       // Apply config defaults
       // Step 1: Scrape
       // Step 2: Standardize
       // Step 3: Parallel processing (images, geocoding, embeddings)
       // Step 3b: Poll embeddings with durable sleep
       // Step 4: Merge
       // Step 5: Import or generate file
     }
   });
   ```

3. Implement embedding polling with workflow sleep:
   ```typescript
   let embeddingsMap = null;
   let attempts = 0;
   const maxAttempts = 120;

   while (attempts < maxAttempts && !embeddingsMap) {
     await step.sleep("wait-for-embeddings", 60000);
     const result = await step.runAction(
       internal.embeddings.retrieveBatchEmbeddings,
       { batchId: embeddingBatch.batchId },
       { name: `poll-embeddings-${attempts}` }
     );

     if (result.status === "completed") {
       embeddingsMap = result.embeddings;
       break;
     } else if (["failed", "expired", "cancelled"].includes(result.status)) {
       break;
     }
     attempts++;
   }
   ```

4. Implement conditional import vs file generation based on `autoImport` config

### Refactoring Notes
- Extract config default logic to helper
- Consider adding progress logging for observability

### Acceptance Criteria
- Workflow executes all steps in correct sequence
- Step 3 (images, geocoding, embeddings) runs in parallel
- Embedding polling uses durable `step.sleep()`
- Polling times out after 2 hours (120 attempts × 1 minute)
- Workflow continues without embeddings on timeout
- `autoImport: true` triggers database import
- `autoImport: false` generates JSON-L file
- Returns success status with summary data

---

## Task 11: Implement Workflow Entry Action

_Requirements: 1, 10_

**Status**: pending

**Dependencies**: Task 10

**Description**: Create action to validate URL and start the workflow, returning workflow ID.

### Tests to Write First (TDD - Red)
- Unit test: Valid URL starts workflow successfully
- Unit test: Invalid URL format returns error
- Unit test: Missing URL returns validation error
- Unit test: Returns workflow ID on success

### Implementation (TDD - Green)
1. Add to `convex/scrapeWorkflow.ts`
2. Implement `startScrapeWorkflow` action:
   ```typescript
   export const startScrapeWorkflow = action({
     args: {
       url: v.string(),
       config: v.optional(/* same as workflow config */),
     },
     handler: async (ctx, args) => {
       // Validate URL format
       try {
         new URL(args.url);
       } catch {
         throw new Error(`Invalid URL: ${args.url}`);
       }

       // Validate config if provided
       if (args.config?.maxDepth && args.config.maxDepth < 1) {
         throw new Error("maxDepth must be at least 1");
       }
       if (args.config?.maxPages && args.config.maxPages < 1) {
         throw new Error("maxPages must be at least 1");
       }

       // Start workflow
       const workflowId = await workflow.start(
         ctx,
         internal.scrapeWorkflow.websiteScrapeWorkflow,
         { url: args.url, config: args.config }
       );

       return { workflowId, url: args.url };
     }
   });
   ```

### Refactoring Notes
- Consider adding duplicate workflow detection (same URL already running)

### Acceptance Criteria
- Validates URL format before starting workflow
- Validates config parameters (positive numbers)
- Starts workflow with provided arguments
- Returns workflow ID for tracking
- Throws clear errors for invalid inputs

---

## Task 12: Error Handling and Logging

_Requirements: 9_

**Status**: pending

**Dependencies**: All previous tasks

**Description**: Add comprehensive error handling and logging throughout the pipeline.

### Tests to Write First (TDD - Red)
- Unit test: Network errors are logged and don't crash pipeline
- Unit test: Validation errors skip individual items and continue
- Unit test: Fatal errors fail workflow atomically
- Integration test: Verify all error paths log appropriately

### Implementation (TDD - Green)
1. Add try-catch blocks with structured logging in all actions/mutations
2. Use `console.error` with context (activity index, step name, error details)
3. Implement error categorization:
   - **Transient**: Network errors, timeouts → retry
   - **Validation**: Invalid data → skip item, continue
   - **Fatal**: Invalid workflow state → fail atomically

4. Add logging to workflow steps:
   ```typescript
   console.log(`[Workflow ${workflowId}] Step 1: Scraped ${rawActivities.length} activities`);
   console.log(`[Workflow ${workflowId}] Step 2: Standardized ${standardizedActivities.length} activities`);
   // etc.
   ```

### Refactoring Notes
- Consider creating logger utility with workflow context
- Add error metrics for monitoring

### Acceptance Criteria
- All errors are caught and logged with context
- Transient errors trigger retries
- Validation errors skip items without crashing
- Fatal errors fail workflow with clear message
- Each workflow step logs completion with counts
- Error logs include workflow ID and step name

---

## Task 13: Integration Testing

_Requirements: All_

**Status**: pending

**Dependencies**: All previous tasks

**Description**: End-to-end integration tests with real or mocked external services.

### Tests to Write First (TDD - Red)
- E2E test: Complete workflow with mock external services
- E2E test: Workflow with partial failures (some images fail)
- E2E test: Workflow with embedding timeout
- E2E test: Workflow with autoImport enabled
- E2E test: Workflow with autoImport disabled (file generation)

### Implementation (TDD - Green)
1. Create test fixtures:
   - Sample website HTML with activities
   - Mock Firecrawl responses
   - Mock Google Maps responses
   - Mock OpenAI batch responses

2. Create integration test suite:
   ```typescript
   test("complete workflow with all features", async () => {
     // Mock all external services
     // Start workflow with test URL
     // Wait for completion
     // Verify activities in database
     // Verify all fields populated correctly
   });

   test("workflow handles partial image failures", async () => {
     // Mock image fetch failures for some activities
     // Verify workflow completes
     // Verify activities without images are still imported
   });
   ```

3. Test error scenarios and edge cases

### Refactoring Notes
- Create test utilities for mocking external services
- Consider using test database for isolation

### Acceptance Criteria
- E2E test covers happy path with all features
- Tests verify partial failure handling
- Tests verify timeout handling
- Tests verify both import modes (auto import + file generation)
- All tests pass consistently
- Test coverage > 80% for critical paths

---

## Task 14: Documentation and Examples

_Requirements: All_

**Status**: pending

**Dependencies**: Task 11, Task 13

**Description**: Document usage, examples, and troubleshooting for the scraping workflow.

### Implementation
1. Create `convex/scrapeWorkflow.md` with:
   - Usage examples
   - Config parameter documentation
   - Expected input/output formats
   - Troubleshooting guide
   - Performance considerations

2. Add JSDoc comments to all public functions

3. Create example invocation script:
   ```typescript
   // example-scrape.ts
   import { api } from "./convex/_generated/api";

   // Example 1: Auto-import with defaults
   const result1 = await ctx.runAction(api.scrapeWorkflow.startScrapeWorkflow, {
     url: "https://example.com/activities",
     config: { autoImport: true }
   });

   // Example 2: Generate file with custom config
   const result2 = await ctx.runAction(api.scrapeWorkflow.startScrapeWorkflow, {
     url: "https://example.com/activities",
     config: {
       maxDepth: 3,
       maxPages: 100,
       autoImport: false,
       urgencyDefault: "high",
       isPublic: false,
     }
   });
   ```

### Acceptance Criteria
- Documentation covers all config parameters
- Examples show common use cases
- Troubleshooting section addresses common errors
- JSDoc comments on all exported functions
- Example scripts are runnable and tested

---

## Summary

**Total Tasks**: 14

**Estimated Complexity**:
- High: Tasks 10, 13 (Workflow orchestration, Integration testing)
- Medium: Tasks 2, 5, 6, 8 (Scraping, Geocoding, Embeddings, Import)
- Low: Tasks 1, 3, 4, 7, 9, 11, 12, 14 (Setup, Formatting, Images, Merging, File gen, Entry, Error handling, Docs)

**Critical Path**: Task 1 → Task 2 → Task 3 → Tasks 4,5,6 (parallel) → Task 7 → Task 8,9 (parallel) → Task 10 → Task 11 → Task 12 → Task 13 → Task 14

**Key Testing Patterns**:
- All tasks follow TDD: Write tests first (Red) → Implement (Green) → Refactor
- Unit tests for individual functions
- Integration tests for step combinations
- E2E tests for complete workflows
- Mock external services for deterministic testing
