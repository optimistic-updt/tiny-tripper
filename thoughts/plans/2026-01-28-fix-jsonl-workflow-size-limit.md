# Fix JSONL Workflow Size Limit Issue Implementation Plan

## Overview

Fix the remaining workflow size limit issue where JSONL content (5.77 MiB) exceeds the 1 MiB workflow step limit. The `generateJsonLFromStorage` action returns the full JSONL string which is too large to pass through the workflow journal.

## Current State Analysis

The workflow currently has two separate steps for JSONL handling:

1. **Step 5b** (`generateJsonLFromStorage` at line 307-311):
   - Retrieves merged activities from storage
   - Generates JSONL content string
   - **Returns the full JSONL string (5.77 MiB) through the workflow** ← Problem

2. **Step 5c** (`storeJsonL` at line 318-323):
   - Receives JSONL content string as parameter ← Also exceeds 1 MiB
   - Stores to Convex storage
   - Returns storage ID and filename

### Key Discoveries:

- `generateJsonLFromStorage` in `convex/importing.ts:152-174` returns `Promise<string>` containing the full JSONL content
- `storeJsonL` in `convex/importing.ts:124-145` expects `jsonlContent: v.string()` as input
- The workflow passes the JSONL string between these two steps, exceeding the 1 MiB journal limit
- Error occurs at line 307-311 of `scrapeWorkflow.ts` when the action returns

## Desired End State

After this plan is complete:
- The workflow completes successfully for datasets with 300+ activities
- JSONL content never passes through the workflow journal
- Only storage IDs are passed between workflow steps
- The final JSONL file is correctly stored in Convex storage

### Verification:
- Run the workflow with `useMockScrape: true` (300 activities)
- Workflow completes without "Value is too large" errors
- Final JSONL file is stored and accessible via storage ID

## What We're NOT Doing

- Not changing the JSONL format or content
- Not modifying the bulk import logic
- Not changing how activities are merged
- Not adding compression (the storage handles this)

## Implementation Approach

Combine the two JSONL steps into a single action that handles everything internally and only returns the storage ID. This follows the same pattern used for other large data (merged activities, embeddings, etc.).

## Phase 1: Create Combined JSONL Action

### Overview

Create a new `generateAndStoreJsonL` action that combines generation and storage, returning only the storage ID.

### Changes Required:

#### 1. Add new action to `convex/importing.ts`

**File**: `convex/importing.ts`
**Changes**: Add a new `generateAndStoreJsonL` action after the existing `storeJsonL` function

```typescript
/**
 * Generate JSONL from activities in storage and store directly
 * Returns only the storage ID (avoids passing large JSONL through workflow)
 */
export const generateAndStoreJsonL = internalAction({
  args: {
    mergedActivitiesStorageId: v.id("_storage"),
    runId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ storageId: Id<"_storage">; filename: string }> => {
    // Retrieve activities from storage
    const activitiesData = await ctx.runAction(
      internal.storageHelpers.retrieveJsonData,
      { storageId: args.mergedActivitiesStorageId },
    );
    const activities = activitiesData as Omit<
      Doc<"activities">,
      "_id" | "_creationTime"
    >[];

    // Generate JSONL content
    if (activities.length === 0) {
      // Store empty file
      const blob = new Blob([""], { type: "application/jsonl" });
      const filename = `scrape-${args.runId}.jsonl`;
      const storageId = await ctx.storage.store(blob);
      console.log(`Stored empty JSONL file: ${filename} (Storage ID: ${storageId})`);
      return { storageId, filename };
    }

    // Convert each activity to a JSON line
    const jsonLines = activities.map((activity) => JSON.stringify(activity));
    const jsonlContent = jsonLines.join("\n");

    // Store directly to storage
    const blob = new Blob([jsonlContent], { type: "application/jsonl" });
    const filename = `scrape-${args.runId}.jsonl`;
    const storageId: Id<"_storage"> = await ctx.storage.store(blob);

    console.log(`Stored JSONL file: ${filename} (Storage ID: ${storageId}, ${activities.length} activities)`);

    return { storageId, filename };
  },
});
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles without errors: `pnpm exec tsc --noEmit`
- [x] ESLint passes: `pnpm run lint`

#### Manual Verification:

- [ ] New function exists in the generated API

---

## Phase 2: Update Workflow to Use Combined Action

### Overview

Modify the workflow to call the new combined action instead of the two separate steps.

### Changes Required:

#### 1. Update `convex/scrapeWorkflow.ts`

**File**: `convex/scrapeWorkflow.ts`
**Changes**: Replace Steps 5b and 5c with a single call to `generateAndStoreJsonL`

**Current code (lines 304-336):**
```typescript
    // Step 5b: Generate JSONL content from storage
    console.log("Generating JSONL file");

    const jsonlContent: string = await step.runAction(
      internal.importing.generateJsonLFromStorage,
      { mergedActivitiesStorageId },
      { name: "generate-jsonl-from-storage" },
    );

    console.log(`Generated JSONL content with ${activitiesCount} activities`);

    // Step 5c: Store JSONL file to storage
    console.log("Storing JSONL file to storage");

    const { storageId, filename }: { storageId: Id<"_storage">; filename: string } =
      await step.runAction(
        internal.importing.storeJsonL,
        { jsonlContent, runId },
        { name: "store-jsonl" },
      );

    // Update workflow record with final JSONL storage ID
    await step.runMutation(
      internal.workflowMetadata.updateWorkflowFile,
      {
        workflowId,
        fileType: "finalJsonl",
        storageId,
      },
      { name: "update-jsonl-storage" },
    );

    console.log(`Stored JSONL file: ${filename} (Storage ID: ${storageId})`);
```

**New code:**
```typescript
    // Step 5b: Generate and store JSONL file directly
    console.log("Generating and storing JSONL file");

    const { storageId, filename }: { storageId: Id<"_storage">; filename: string } =
      await step.runAction(
        internal.importing.generateAndStoreJsonL,
        { mergedActivitiesStorageId, runId },
        { name: "generate-and-store-jsonl" },
      );

    // Update workflow record with final JSONL storage ID
    await step.runMutation(
      internal.workflowMetadata.updateWorkflowFile,
      {
        workflowId,
        fileType: "finalJsonl",
        storageId,
      },
      { name: "update-jsonl-storage" },
    );

    console.log(`Stored JSONL file: ${filename} (Storage ID: ${storageId})`);
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles without errors: `pnpm exec tsc --noEmit`
- [x] ESLint passes: `pnpm run lint`

#### Manual Verification:

- [ ] Run workflow with mock data (300 activities)
- [ ] Workflow completes without "Value is too large" error
- [ ] JSONL file is stored correctly in Convex storage
- [ ] If autoImport enabled, activities are imported to database

---

## Testing Strategy

### Automated Tests:

- TypeScript compilation
- ESLint validation

### Manual Testing Steps:

1. Start the Convex dev server
2. Trigger a workflow with `useMockScrape: true` and 300 activities
3. Monitor logs for any "Value is too large" errors
4. Verify workflow completes successfully
5. Check that final JSONL storage ID is recorded in workflow metadata
6. If `autoImport: true`, verify activities appear in the database

## Performance Considerations

- The new combined action processes JSONL content entirely within the action, avoiding workflow journal overhead
- Memory usage is similar but data never needs to serialize through the workflow
- No additional storage operations (same number of reads/writes)

## References

- Previous fix for merged activities: Same pattern applied here
- Convex workflow limitations: https://www.convex.dev/components/workflow#limitations
- Error log: "Value is too large (5.77 MiB > maximum size 1 MiB)"
