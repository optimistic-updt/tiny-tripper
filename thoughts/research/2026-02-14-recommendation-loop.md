---
date: 2026-02-14T12:00:00-05:00
researcher: claude
git_commit: 3d32e627b6a283c77e72f91a0fcc499e71368c1a
branch: main
repository: tiny-tripper
topic: "How the recommendation process in app/tt/play/ works"
tags: [research, codebase, recommendations, activities, scoring, geospatial]
status: complete
last_updated: 2026-02-14
last_updated_by: claude
---

# Research: How the Recommendation Loop in app/tt/play/ Works

**Date**: 2026-02-14
**Git Commit**: 3d32e62
**Branch**: main
**Repository**: tiny-tripper

## Research Question

How does the recommendation process in `app/tt/play/` work? Trace the whole loop.

## Summary

The Play page implements a "slot machine" style activity recommender. The user clicks "Let's Play" to receive one activity at a time, scored and ranked by a multi-factor algorithm on the Convex backend. The loop works as follows: the frontend maintains an `excludeIds` list and a `randomSeed`, passes them to a Convex reactive query (`getRecommendation`), and each button press accepts the current recommendation into a local history, adds its ID to the exclude list, and generates a new seed — causing Convex to reactively return the next-best activity. Filters (at-home, rainproof, location) narrow the candidate pool, and authenticated users can hide activities or override urgency to personalize future results.

## Detailed Findings

### 1. Frontend State Machine (`app/tt/play/page.tsx`)

The page manages the recommendation loop through several pieces of React state:

| State | Purpose |
|---|---|
| `recommendationHistory` | Array of all accepted recommendations (with scores) |
| `currentIndex` | Pointer into history (enables "back" navigation) |
| `excludeIds` | Activity IDs already shown — sent to backend to avoid repeats |
| `randomSeed` | Integer seed for deterministic scoring jitter |
| `filters` | `{ atHome: boolean, rainproof: boolean }` — persisted in sessionStorage |
| `locationEnabled` / `userLocation` / `searchRadius` | Geolocation state |

**The reactive query** ([page.tsx:128-138](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/app/tt/play/page.tsx#L128-L138)):
```typescript
const recommendation = useQuery(api.activities.getRecommendation, {
  excludeIds, filters, randomSeed,
  userLocation: locationEnabled && userLocation ? { ... } : undefined,
  maxDistanceMeters: locationEnabled && userLocation ? searchRadius : undefined,
});
```
This Convex query is **reactive** — it re-runs whenever any argument changes.

### 2. The "Let's Play" Button Click (`handlePlayClick`)

[page.tsx:146-162](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/app/tt/play/page.tsx#L146-L162)

When clicked:
1. Pushes the current `recommendation` onto `recommendationHistory` (truncating any forward history from "back" navigation)
2. Updates `currentIndex` to point to the new entry
3. Adds `recommendation._id` to `excludeIds`
4. Generates a new `randomSeed` via `Math.floor(Math.random() * 1000000)`

Steps 3 and 4 change the query arguments, which triggers Convex to reactively return the next recommendation.

### 3. Backend: `getRecommendation` Query

[convex/activities.ts:283-452](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/convex/activities.ts#L283-L452)

#### 3a. Data Loading (lines 302-327)

1. Gets user identity via `ctx.auth.getUserIdentity()`
2. If authenticated, loads all `userActivityPreferences` for the user into a `Map<activityId, preference>` using the `by_userId` index
3. Queries all activities, filtering at the DB level for `isPublic === true` OR owned by the current user

#### 3b. Geospatial Pre-filter (lines 329-339)

If `userLocation` and `maxDistanceMeters` are provided:
- Calls `geospatial.queryNearest(ctx, userLocation, 100, maxDistanceMeters)` using the `@convex-dev/geospatial` component
- Builds a `Set<string>` of nearby activity IDs for O(1) lookup

The geospatial index is populated at activity creation time ([activities.ts:90-103](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/convex/activities.ts#L90-L103)) when latitude/longitude are present.

#### 3c. Filtering Pipeline (lines 342-385)

Activities are removed if **any** of these conditions is true:

1. **In excludeIds** — already shown to the user
2. **Past endDate** — expired activities
3. **Hidden by user** — `userActivityPreferences.hidden === true`
4. **Tag filters (AND logic)**:
   - If `filters.atHome === true`, activity must have `"At Home"` tag
   - If `filters.rainproof === true`, activity must have `"rain-approved"` tag
5. **Outside location radius** — not in the `nearbyActivityIds` set

#### 3d. Scoring Algorithm (lines 386-433)

Each surviving activity receives a composite score:

| Priority | Condition | Points |
|---|---|---|
| 1. Urgency | High | +100 |
| | Medium | +50 |
| | Low | +10 |
| 2. Deadline | End date within 2 weeks | +80 base |
| | Bonus: `20 - daysUntilEnd` | up to +19 |
| 3. Ownership | User's own activity | +30 |
| 4. Location | Has location data | +10 |
| 5. Tags | Has any tags | +5 |

**Urgency uses the user's override** (`urgencyOverride` from preferences) if set, otherwise the activity's default urgency.

#### 3e. Random Jitter (lines 435-444)

When `randomSeed` is provided:
- Uses a seeded PRNG (mulberry32 algorithm, [lines 263-272](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/convex/activities.ts#L263-L272))
- Adds ±20 points of jitter to each score
- Same seed always produces same jitter → deterministic until the seed changes

#### 3f. Selection (lines 446-451)

Sorts descending by score, returns the top activity (or `null` if none remain).

### 4. User Preference Mutations

[convex/userActivityPreferences.ts](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/convex/userActivityPreferences.ts)

Two mutations feed back into the recommendation loop:

**`setActivityHidden`** (lines 5-37): Sets `hidden: true` on a preference record (upsert pattern). The "hide" button on the card ([page.tsx:309-319](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/app/tt/play/page.tsx#L309-L319)) calls this and then immediately calls `handlePlayClick()` to advance to the next recommendation. Hidden activities are filtered out in step 3c.

**`setActivityUrgency`** (lines 40-77): Sets or clears `urgencyOverride` on a preference record. The urgency dropdown ([page.tsx:242-302](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/app/tt/play/page.tsx#L242-L302)) allows overriding to high/medium/low or resetting to default. This affects scoring in step 3d.

**`getActivityUserPreference`** (lines 80-108): Read-only query used to display the current preference state on the card. Called with `"skip"` when no activity is displayed ([page.tsx:174-177](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/app/tt/play/page.tsx#L174-L177)).

All three use the `by_userId_and_activityId` compound index.

### 5. Filter & Location Reset Behavior

When filters, location, or search radius change, the frontend resets the entire loop ([page.tsx:78-86](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/app/tt/play/page.tsx#L78-L86), [120-126](https://github.com/optimistic-updt/tiny-tripper/blob/3d32e627b6a283c77e72f91a0fcc499e71368c1a/app/tt/play/page.tsx#L120-L126)):
- Clears `recommendationHistory`
- Resets `currentIndex` to -1
- Clears `excludeIds`
- Generates a new `randomSeed`

This causes the query to start fresh with a new candidate pool.

### 6. Display & Navigation

- **No activity shown yet**: Shows "Ready to play?" prompt (or "No matching activities" if query returned null)
- **Activity card**: Shows name, description, location (linked to Google Maps), end date with countdown, tags, and recommendation score
- **Back button**: Navigates backward through `recommendationHistory` (doesn't re-query; uses local state)
- **Filters drawer**: Bottom sheet (vaul `Drawer`) with at-home and rainproof toggles

## Code References

- `app/tt/play/page.tsx` — Frontend Play page component
- `app/tt/play/3d_button.module.css` — 3D push button styles
- `convex/activities.ts:263-272` — Seeded PRNG (mulberry32)
- `convex/activities.ts:283-452` — `getRecommendation` query
- `convex/activities.ts:90-103` — Geospatial index population
- `convex/userActivityPreferences.ts:5-37` — `setActivityHidden` mutation
- `convex/userActivityPreferences.ts:40-77` — `setActivityUrgency` mutation
- `convex/userActivityPreferences.ts:80-108` — `getActivityUserPreference` query
- `convex/schema.ts:5-36` — Activities table schema
- `convex/schema.ts:126-138` — UserActivityPreferences table schema

## Architecture Documentation

The recommendation system follows a **reactive query pattern** native to Convex:
- The frontend passes all parameters as query arguments to `useQuery`
- Changing any argument (excludeIds, randomSeed, filters, location) triggers an automatic re-execution
- The backend is stateless — all state lives in the database and the frontend's React state
- User preferences (hidden, urgency override) persist in the `userActivityPreferences` table and are loaded fresh on each query execution
- Geospatial filtering uses the `@convex-dev/geospatial` component configured in `convex/convex.config.ts`

## Open Questions

- The geospatial query is capped at 100 results — activities beyond this count within the radius would be excluded
- The `recommendation` variable from `useQuery` is always the "next" recommendation (pre-fetched), displayed only after the user clicks "Let's Play"
- Vector embeddings exist on activities but are used for search (`searchActivities`), not for the Play page recommendation loop
