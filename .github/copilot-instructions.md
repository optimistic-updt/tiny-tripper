# Tiny Tripper - AI Agent Instructions

## Project Overview

Activity recommendation app for parents in Melbourne. Recommends the BEST activity based on urgency, time constraints, location, and tags. Features AI-powered website scraping to import activities from local websites.

**Tech Stack**: Next.js 15 (App Router) + React 19 + Convex (backend/DB) + Clerk (auth) + PostHog (analytics) + Tailwind 4 + Radix UI Themes

## Architecture

### Backend: Convex-Centric

- **Database & API**: Convex handles everything (queries, mutations, actions, real-time subscriptions)
- **Authentication**: Clerk integrated via JWT (`convex/auth.config.ts`)
- **No traditional backend**: All server logic lives in `convex/` directory
- **Environment**: Two separate env files:
  - `env.ts` (client-side, T3 Env with Next.js vars like `NEXT_PUBLIC_*`)
  - `convex/env.ts` (server-side, T3 Env with secret keys like `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`)

### Data Model

```typescript
activities: {
  name: string
  description?: string
  urgency: "low" | "medium" | "high"
  location?: { name, placeId, formattedAddress, latitude, longitude, ... }
  startDate?: string
  endDate?: string
  isPublic?: boolean
  userId?: string  // Clerk user ID
  tags?: string[]
  embedding?: number[]  // OpenAI text-embedding-3-small (1536 dimensions)
  imageId?: Id<"_storage">
}
```

**Key Index**: Vector search on `embedding` field for semantic activity search

### Recommendation Engine

Located in `convex/activities.ts::getRecommendation`. **Algorithm evolves based on user feedback** - expect constant refinement.

**Current Scoring System**:

1. **Urgency** (100/50/10 pts) - high/medium/low priority
2. **End date** (80+ pts) - activities ending within 2 weeks get bonus points
3. **User ownership** (30 pts) - prioritize user's own activities
4. **Location data** (10 pts) - activities with geocoded locations
5. **Tags** (5 pts) - rich metadata bonus

**Current Filters**: `atHome` and `rainproof` tags (AND logic)

**Planned**: Location-based filtering using `@convex-dev/geospatial` ([docs](https://github.com/get-convex/geospatial)) - will ask user location and recommend within search radius

## Development Workflows

### Commands (uses `pnpm`)

```bash
npm run dev              # Full-stack: Next.js + Convex (parallel)
npm run dev:frontend     # Next.js only
npm run dev:backend      # Convex only
npm run upload-embeddings # Batch upload embeddings from JSONL
npm run merge-embeddings  # Merge embedding data
```

**Critical**: All commands wrap with `dotenvx run --convention=nextjs` for env loading

### Convex Function Patterns

**ALWAYS use new syntax** (see `.cursor/rules/convex_rules.mdc` for comprehensive rules):

```typescript
// Public query
export const listActivities = query({
  args: {},
  returns: v.array(
    v.object({
      /* shape */
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return await ctx.db
      .query("activities")
      .filter((q) =>
        q.or(
          q.eq(q.field("isPublic"), true),
          q.eq(q.field("userId"), identity?.subject),
        ),
      )
      .order("desc")
      .collect();
  },
});

// Internal mutation (private)
export const createActivityDocument = internalMutation({
  args: { name: v.string() /* ... */ },
  handler: async (ctx, args) => {
    const activityId = await ctx.db.insert("activities", {
      /* ... */
    });

    // Geospatial indexing (if location exists)
    if (args.location?.latitude && args.location?.longitude) {
      await geospatial.insert(
        ctx,
        activityId,
        {
          /* coords */
        },
        {
          /* metadata */
        },
      );
    }

    return activityId;
  },
});

// Action (can call external APIs)
export const createActivity = action({
  args: {
    /* ... */
  },
  handler: async (ctx, args) => {
    const embedding = await generateEmbedding(searchableText);
    await ctx.runMutation(internal.activities.createActivityDocument, {
      ...args,
      embedding,
    });
  },
});
```

**Key Rules**:

- Use `internalMutation/internalQuery/internalAction` for private functions
- Always include `args` and `returns` validators
- Call functions via `api.*` (public) or `internal.*` (private), never direct imports
- Use `ctx.auth.getUserIdentity()` for Clerk user data (returns `{ subject: userId }`)
- No `ctx.db` in actions - only queries/mutations have DB access

### Website Scraping ETL Pipeline

**Workflow-based**: Uses `@convex-dev/workflow` for durable, transactional multi-step processing (see `spec/website-scraping-etl-pipeline/design.md` for full architecture).

**Entry**: `convex/scrapeWorkflow.ts::websiteScrapeWorkflow`

**Steps**:

1. **Scrape** (`convex/scraping.ts`) - Firecrawl API extracts activities from websites
2. **Standardize** (`convex/formatting.ts`) - Validate/normalize data
3. **Parallel Processing**:
   - `convex/imageProcessing.ts` - Download images → Convex storage
   - `convex/geocoding.ts` - Google Maps API → lat/long + placeId
   - `convex/embeddings.ts` - OpenAI Batch API → embeddings
4. **Poll** - Workflow uses durable `step.sleep()` for embedding batch completion (exactly-once guarantee)
5. **Merge** (`convex/formatting.ts::mergeActivityData`) - Combine all enriched data
6. **Import or Export**:
   - `autoImport: true` → bulk insert to DB
   - `autoImport: false` → generate JSONL file in storage (for future retry/archival)

**Why Workflows**: Guarantees durability across server restarts, exactly-once step execution, atomic failure handling. Rejected scheduled functions due to at-most-once guarantees and complex state management.

**⚠️ CRITICAL - 1MB Workflow Limit** ([docs](https://www.convex.dev/components/workflow#limitations)):

- **Problem**: Steps can only take in/return max 1 MiB of data per workflow execution
- **Current Issue**: Batch embeddings and final JSONL can exceed 1 MiB with many activities
- **Solution Pattern**: Store large results in DB, pass document IDs through workflow instead of full data
- **Active Work**: This is a known issue we're actively fixing - when modifying workflow, always check payload sizes and use DB storage for large datasets

## Frontend Patterns

### Provider Hierarchy (in `app/layout.tsx`)

```tsx
<PostHogProvider>
  <ClerkProvider dynamic>
    <ConvexClientProvider>
      {" "}
      {/* Wraps Clerk's useAuth */}
      <Theme accentColor="tomato" radius="large">
        {children}
      </Theme>
    </ConvexClientProvider>
  </ClerkProvider>
</PostHogProvider>
```

### React Hook Usage

```tsx
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// In component
const activities = useQuery(api.activities.listActivities);
const createActivity = useMutation(api.activities.createActivity);
const search = useAction(api.activities.searchActivities);
```

**Note**: `useQuery` returns `undefined` during loading, not `null`

### Styling Conventions

- **Tailwind 4** with Geist fonts (`--font-geist-sans`, `--font-geist-mono`)
- **Radix UI Themes** for components (`Button`, `Card`, `Badge`, `Text`, `Heading`, etc.)
- **Custom CSS modules** for special effects (see `app/tt/play/3d_button.module.css`)
- Use `className="..."` for Tailwind, Radix components have built-in props

## Critical Gotchas

1. **Workflow 1MB limit**: Steps can only pass 1 MiB total data. **Active issue**: Batch embeddings/JSONL exceed this. Always store large results in DB and pass IDs, not full data arrays.
2. **Two env.ts files**: Client vars in root `env.ts`, server secrets in `convex/env.ts`. Never mix.
3. **Embedding generation is async**: Uses OpenAI Batch API (can take hours). Workflow handles polling with retry logic.
4. **Geospatial component**: Activities with locations auto-indexed via `@convex-dev/geospatial` component. Future: proximity-based recommendations (search within radius of user location).
5. **Google Maps API**: Available in both client (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) and server (`GOOGLE_MAPS_API_KEY` in convex/env.ts).
6. **Image storage**: Use `ctx.storage.generateUploadUrl()` (mutation) → upload from client → store `Id<"_storage">` in DB.
7. **Authentication**: Clerk's `userId` is stored as `userId` field (not `_id`). Use `await ctx.auth.getUserIdentity()` in Convex.
8. **TypeScript**: Import `Doc<"tableName">` and `Id<"tableName">` from `convex/_generated/dataModel`, not manual types.
9. **Recommendation algorithm evolution**: Scoring and filters change based on user feedback - check git history before assuming current logic is final.

## File Organization

```
app/                      # Next.js pages (App Router)
  tt/                     # Main app routes (/tt/*)
    play/page.tsx         # Recommendation UI (scoring algorithm consumer)
    activities/page.tsx   # Activity list
    create/page.tsx       # Activity creation form

components/               # Shared React components
  ConvexClientProvider.tsx  # Wraps ConvexProviderWithClerk
  GooglePlacesAutocomplete.tsx  # Location input
  ImageUpload.tsx         # Image upload with Convex storage

convex/                   # Backend (all server logic)
  activities.ts           # Core activity CRUD + recommendation + search
  scrapeWorkflow.ts       # Workflow definition for web scraping
  scraping.ts             # Firecrawl integration
  formatting.ts           # Data standardization/merging
  imageProcessing.ts      # Image download/storage
  geocoding.ts            # Google Maps geocoding
  embeddings.ts           # OpenAI batch embeddings
  importing.ts            # JSONL generation + bulk import
  schema.ts               # Database schema definition
  auth.config.ts          # Clerk integration

seed/                     # Sample data
  ready/                  # JSONL files with embeddings (ready to import)
  raw/                    # Scraped data (needs processing)

spec/                     # Architecture docs
  website-scraping-etl-pipeline/  # Full design doc for scraping workflow
```

## Integration Points

- **Clerk**: JWT authentication, `useAuth()` hook, `ctx.auth.getUserIdentity()` in Convex
- **OpenAI**: Embeddings via Batch API (text-embedding-3-small, 1536 dims)
- **Firecrawl**: Website scraping with LLM-based extraction (schema prompt)
- **Google Maps**: Geocoding API + Places API for location data
- **PostHog**: Analytics (`posthog.ts` client config, `PostHogProvider.tsx` wrapper). Event tracking planned for future implementation.
- **Convex Storage**: File uploads (images), returns `Id<"_storage">` for DB references

## Testing & Quality

- **Pre-commit hook**: Husky runs TypeScript/ESLint checks before commits
- **Linting**: ESLint 9 with Next.js config
- **Formatting**: Prettier configured
- **Type Safety**: Strict TypeScript, T3 Env for runtime validation

**Always check TypeScript/ESLint errors before committing** (enforced by Husky).

## Migration Notes (for Cursor/Claude users)

This project originated from `CLAUDE.md` conventions. Key updates:

- Expanded Convex patterns (see `.cursor/rules/convex_rules.mdc` for full guide)
- Detailed scraping workflow architecture (now workflow-based, not action-only)
- Recommendation scoring algorithm specifics
- Two-environment pattern (client/server env split)
