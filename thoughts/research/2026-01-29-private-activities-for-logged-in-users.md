---
date: 2026-01-29T08:45:23+09:00
researcher: Claude
git_commit: c00a750bc5a41f0d83dcf79a598a9c886d1f8e38
branch: main
repository: tiny-tripper
topic: "Private activities for logged-in users - authentication and activity privacy system"
tags: [research, codebase, authentication, activities, privacy, clerk]
status: complete
last_updated: 2026-01-29
last_updated_by: Claude
---

# Research: Private Activities for Logged-In Users

**Date**: 2026-01-29T08:45:23+09:00
**Researcher**: Claude
**Git Commit**: c00a750bc5a41f0d83dcf79a598a9c886d1f8e38
**Branch**: main
**Repository**: tiny-tripper

## Research Question

The app is currently made so that you can use all of it publicly without login. We now want to incentivize signing up to log in. By logging in, you'll be able to make an activity private.

## Summary

The codebase already has the foundational infrastructure for private activities:

1. **Authentication is fully configured** - Clerk is integrated with Convex via JWT tokens. The `ctx.auth.getUserIdentity()` pattern is used throughout backend functions.

2. **The `isPublic` field exists** - Activities already have an `isPublic: v.optional(v.boolean())` field in the schema.

3. **Privacy filtering is implemented** - The `listActivities` and `getRecommendation` queries already filter activities based on `isPublic === true OR userId === currentUser`.

4. **User ownership is tracked** - Activities store `userId` from `identity?.subject` when created.

**Current State**: The app defaults to public (`isPublic: true`) and the frontend form hardcodes this value. The UserButton is commented out, so there's no visible login UI.

## Detailed Findings

### Authentication System

#### Clerk Configuration

**File**: `convex/auth.config.ts`

```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

**File**: `middleware.ts`

- Uses `clerkMiddleware` from `@clerk/nextjs/server`
- Currently only protects the `/server` route
- Other routes are accessible without authentication

**File**: `components/ConvexClientProvider.tsx`

- Wraps app with `ConvexProviderWithClerk`
- Passes Clerk's `useAuth` hook to bridge authentication states

**File**: `app/layout.tsx:41`

- `<ClerkProvider dynamic>` wraps the entire application
- The `dynamic` prop enables lazy loading of Clerk

#### User Identity in Convex

User identity is accessed via `ctx.auth.getUserIdentity()` which returns:

- `identity.subject` - The unique user ID (stored as `userId` in database)
- Returns `null` if user is not authenticated

### Activities Schema and Privacy Model

**File**: `convex/schema.ts:5-36`

```typescript
activities: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  location: v.optional(
    v.object({
      name: v.string(),
      placeId: v.optional(v.string()),
      formattedAddress: v.string(),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      // ... address components
    }),
  ),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  isPublic: v.optional(v.boolean()), // ← Privacy field
  userId: v.optional(v.string()), // ← Owner field
  tags: v.optional(v.array(v.string())),
  embedding: v.optional(v.array(v.float64())),
  imageId: v.optional(v.id("_storage")),
});
```

**Key fields for privacy**:

- `isPublic` - Controls visibility (optional boolean)
- `userId` - Links activity to creator (optional string)

**Indexes**:

- `by_name` - Standard index on name field
- `by_embedding` - Vector index for semantic search
- **Note**: No index exists on `userId` or `isPublic`

### Activity Creation

**File**: `convex/activities.ts:44-107` - `createActivityDocument` internal mutation

```typescript
const identity = await ctx.auth.getUserIdentity();

const activityId = await ctx.db.insert("activities", {
  name: args.name,
  description: args.description ?? undefined,
  urgency: args.urgency ?? "medium",
  location: args.location ?? undefined,
  startDate: args.startDate ?? undefined,
  endDate: args.endDate ?? undefined,
  isPublic: args.isPublic ?? false, // ← Defaults to false
  userId: identity?.subject, // ← Captures user if authenticated
  tags: args.tags ?? undefined,
  embedding: args.embedding ?? undefined,
  imageId: args.imageId ?? undefined,
});
```

**Default behavior**:

- `isPublic` defaults to `false` in the backend mutation
- `userId` is set to `identity?.subject` (undefined if not logged in)

**File**: `app/tt/create/page.tsx:70` - Frontend form

```typescript
const form = useForm<z.infer<typeof activitySchema>>({
  resolver: zodResolver(activitySchema),
  defaultValues: {
    name: "",
    description: "",
    isPublic: true, // ← Frontend defaults to true
    // ...
  },
});
```

**Current issue**: The frontend defaults `isPublic` to `true`, overriding the backend default.

### Activity Queries with Privacy Filtering

**File**: `convex/activities.ts:155-171` - `listActivities` query

```typescript
export const listActivities = query({
  args: {},
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
```

**Privacy logic**: Shows activities where:

- `isPublic === true` (anyone can see), OR
- `userId === identity?.subject` (owner can always see their own)

**File**: `convex/activities.ts:251-259` - `getRecommendation` query uses the same filter pattern.

**File**: `convex/activities.ts:173-180` - `getActivity` query

```typescript
export const getActivity = query({
  args: { id: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

**Security note**: This query does NOT check permissions - anyone with an activity ID can fetch it directly.

### Recommendation Scoring

**File**: `convex/activities.ts:323-326`

```typescript
// User's own activities get priority
if (activity.userId === identity?.subject) {
  score += 30;
}
```

Owner's activities receive a +30 point scoring bonus in recommendations.

### Frontend Pages

**File**: `app/tt/activities/page.tsx:24`

- Calls `listActivities` query
- Displays all visible activities (user's own + public)

**File**: `app/tt/play/page.tsx:61-65`

- Calls `getRecommendation` query
- Manages exclusion list and filters

**File**: `app/tt/create/page.tsx`

- Has `isPublic` switch in form (lines 168-182)
- Currently defaults to true

### Login UI

**File**: `app/tt/layout.tsx:13`

```typescript
{
  /* <UserButton /> */
}
```

The Clerk `UserButton` component is commented out. There is no visible login/signup UI in the current app.

### Scraping/Import Defaults

**File**: `convex/formatting.ts:112`

```typescript
isPublic: activity.isPublic ?? defaultActivityValues?.isPublic ?? true,
```

Activities imported via web scraping default to `isPublic: true`.

## Code References

- `convex/auth.config.ts:8` - Clerk JWT domain configuration
- `convex/schema.ts:26-27` - `isPublic` and `userId` fields
- `convex/activities.ts:74-84` - User identity capture in creation
- `convex/activities.ts:162-167` - Privacy filter in listActivities
- `convex/activities.ts:253-258` - Privacy filter in getRecommendation
- `convex/activities.ts:173-179` - getActivity with no permission check
- `convex/activities.ts:324-326` - Owner scoring bonus
- `app/tt/create/page.tsx:70` - Frontend isPublic default to true
- `app/tt/layout.tsx:13` - Commented out UserButton
- `middleware.ts:3` - Protected routes (only /server)
- `components/ConvexClientProvider.tsx:15-18` - Clerk-Convex integration

## Architecture Documentation

### Current Privacy Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Activity Visibility                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  isPublic: true  ───────►  Visible to everyone               │
│                                                              │
│  isPublic: false ───────►  Visible ONLY to owner (userId)    │
│                                                              │
│  userId: null    ───────►  Anonymous activity (no owner)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
Browser Load
    │
    ▼
ClerkProvider (lazy load)
    │
    ▼
ConvexProviderWithClerk
    │
    ▼
Convex queries include JWT (if logged in)
    │
    ▼
ctx.auth.getUserIdentity() → identity | null
    │
    ▼
identity?.subject → userId string | undefined
```

### Query Access Patterns

| Query               | Checks Auth | Filters by Privacy | Notes                       |
| ------------------- | ----------- | ------------------ | --------------------------- |
| `listActivities`    | Yes         | Yes                | Shows public + user's own   |
| `getRecommendation` | Yes         | Yes                | Shows public + user's own   |
| `getActivity`       | No          | No                 | Direct access by ID         |
| `searchActivities`  | No          | No                 | Uses getActivity internally |

## Historical Context (from thoughts/)

- `thoughts/research/2026-01-28-get-recommendation-algorithm.md` - Documents the existing filtering by `isPublic` and `userId`
- `thoughts/plans/2026-01-28-landing-page-quiz-funnel.md` - Quiz funnel planning that includes user ID capture

## Open Questions

1. **Should `getActivity` require permission checks?** - Currently anyone with an activity ID can access it, even if `isPublic: false`.
   this should have permissions check

2. **Should `searchActivities` respect privacy?** - Vector search returns activities without checking visibility.
   all good for now

3. **Should there be an index on `userId`?** - Currently no index exists for efficiently querying user's activities.
   probably

4. **What should happen to anonymous activities?** - Activities created without login have `userId: null` and could become "orphaned" private activities if `isPublic` is later set to false.
   make sure that all activities default as `isPublic = true`
