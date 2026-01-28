---
date: 2026-01-28T10:08:26Z
researcher: Claude
git_commit: c00a750bc5a41f0d83dcf79a598a9c886d1f8e38
branch: main
repository: tiny-tripper
topic: "How is the getRecommendation endpoint implemented?"
tags: [research, codebase, activities, recommendation, scoring-algorithm]
status: complete
last_updated: 2026-01-28
last_updated_by: Claude
---

# Research: getRecommendation Endpoint Implementation

**Date**: 2026-01-28T10:08:26Z
**Researcher**: Claude
**Git Commit**: c00a750bc5a41f0d83dcf79a598a9c886d1f8e38
**Branch**: main
**Repository**: tiny-tripper

## Research Question

How is the getRecommendation endpoint implemented? Document the algorithm.

## Summary

The `getRecommendation` endpoint is a Convex query function that returns a single recommended activity based on a multi-factor scoring algorithm. It prioritizes activities by urgency, time-sensitivity (end date proximity), user ownership, and content richness (location and tags). The algorithm filters out excluded activities and expired activities, applies optional tag-based filters, scores remaining activities, and returns the highest-scoring one.

## Detailed Findings

### Function Definition

**Location**: `convex/activities.ts:227-337`

The function is defined as a Convex `query` with the following signature:

```typescript
export const getRecommendation = query({
  args: {
    excludeIds: v.optional(v.array(v.id("activities"))),
    filters: v.optional(
      v.object({
        atHome: v.boolean(),
        rainproof: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => { ... }
});
```

### Input Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `excludeIds` | `Id<"activities">[]` (optional) | Array of activity IDs to exclude from recommendations (previously shown activities) |
| `filters.atHome` | `boolean` (optional) | When true, only return activities with "at home" tag |
| `filters.rainproof` | `boolean` (optional) | When true, only return activities with "rain-approved" tag |

### Algorithm Flow

#### Phase 1: Data Retrieval (lines 243-251)

Retrieves all activities the user has access to:
- Activities where `isPublic === true`
- Activities where `userId === identity.subject` (user's own activities)

```typescript
const allActivities = await ctx.db
  .query("activities")
  .filter((q) =>
    q.or(
      q.eq(q.field("isPublic"), true),
      q.eq(q.field("userId"), identity?.subject),
    ),
  )
  .collect();
```

#### Phase 2: Filtering (lines 254-286)

Activities are excluded if they match any of these criteria:

1. **Excluded IDs**: Activity `_id` is in the `excludeIds` array
2. **Expired**: Activity has an `endDate` that is in the past
3. **Tag Filters (AND logic)**:
   - If `atHome` filter is active, activity must have "at home" tag
   - If `rainproof` filter is active, activity must have "rain-approved" tag

#### Phase 3: Scoring (lines 287-331)

Each activity receives a score based on five weighted factors:

| Priority | Factor | Score | Description |
|----------|--------|-------|-------------|
| 1 | Urgency: High | +100 | Activity marked as high urgency |
| 1 | Urgency: Medium | +50 | Activity marked as medium urgency |
| 1 | Urgency: Low | +10 | Activity marked as low urgency |
| 2 | End date within 2 weeks | +80 | Activity expires within 14 days |
| 2 | End date bonus | +0 to +19 | Bonus points: `20 - daysUntilEnd` (more points for sooner deadlines) |
| 3 | User ownership | +30 | Activity belongs to the current user |
| 4 | Has location | +10 | Activity has location data |
| 5 | Has tags | +5 | Activity has at least one tag |

**Maximum Possible Score**: 100 (high urgency) + 80 (end date within 2 weeks) + 19 (ending tomorrow) + 30 (own activity) + 10 (has location) + 5 (has tags) = **244 points**

**Minimum Possible Score**: 10 points (low urgency activity with no other attributes)

#### Scoring Formula Details

```typescript
let score = 0;

// Priority 1: Urgency
if (activity.urgency === "high") score += 100;
else if (activity.urgency === "medium") score += 50;
else score += 10;

// Priority 2: End date proximity
if (activity.endDate) {
  const endDate = new Date(activity.endDate);
  if (endDate <= twoWeeksFromNow) {
    score += 80;
    const daysUntilEnd = Math.max(1, Math.ceil((endDate - now) / (24*60*60*1000)));
    score += Math.max(0, 20 - daysUntilEnd);
  }
}

// Priority 3: User ownership
if (activity.userId === identity?.subject) score += 30;

// Priority 4: Has location
if (activity.location) score += 10;

// Priority 5: Has tags
if (activity.tags && activity.tags.length > 0) score += 5;
```

#### Phase 4: Selection (line 332-335)

Activities are sorted by score in descending order, and the highest-scoring activity is returned (or `null` if no activities match).

```typescript
.sort((a, b) => b.score - a.score);
return scoredActivities.length > 0 ? scoredActivities[0] : null;
```

### Return Value

Returns a single activity document with an additional `score` field:

```typescript
type Recommendation = Doc<"activities"> & { score: number };
```

Returns `null` when no activities match the criteria.

## Frontend Usage

**Location**: `app/tt/play/page.tsx`

The frontend uses a "carousel" pattern:
1. Calls `useQuery(api.activities.getRecommendation, { excludeIds, filters })`
2. User clicks "Let's Play" button to accept the recommendation
3. Accepted recommendation is added to `excludeIds` for the next query
4. Maintains a `recommendationHistory` array for navigation
5. User can navigate back through history with back button
6. Filters are persisted in `sessionStorage`

### State Management

```typescript
const [recommendationHistory, setRecommendationHistory] = useState<Recommendation[]>([]);
const [currentIndex, setCurrentIndex] = useState(-1);
const [excludeIds, setExcludeIds] = useState<Id<"activities">[]>([]);
const [filters, setFilters] = useState({ atHome: false, rainproof: false });
```

## Database Schema

**Location**: `convex/schema.ts:5-34`

The `activities` table includes the following relevant fields:

| Field | Type | Description |
|-------|------|-------------|
| `urgency` | `"low" \| "medium" \| "high"` | Required urgency level |
| `endDate` | `string` (optional) | ISO date string for activity expiration |
| `userId` | `string` (optional) | Owner's user ID |
| `location` | `object` (optional) | Location data with address components |
| `tags` | `string[]` (optional) | Array of tag strings |
| `isPublic` | `boolean` (optional) | Whether activity is publicly visible |

## Code References

- `convex/activities.ts:214-227` - Algorithm documentation comment
- `convex/activities.ts:227-337` - Full `getRecommendation` function implementation
- `convex/activities.ts:237-240` - Two-week window calculation
- `convex/activities.ts:254-286` - Filtering logic
- `convex/activities.ts:287-331` - Scoring algorithm
- `convex/schema.ts:5-34` - Activities table schema
- `app/tt/play/page.tsx:56-59` - Frontend query call
- `app/tt/play/page.tsx:61-74` - handlePlayClick function (exclude ID management)

## Architecture Documentation

### Key Design Patterns

1. **Score-based ranking**: Activities are scored numerically rather than using complex sorting rules, making the priority system explicit and tunable
2. **Exclusion-based pagination**: Instead of traditional pagination, the system uses an exclusion list to prevent showing the same recommendation twice
3. **Filter composition**: Filters use AND logic - all active filters must be satisfied
4. **Reactive updates**: Using Convex's `useQuery` hook, recommendations automatically update when underlying data changes

### Time Calculations

- "Two weeks from now" is calculated as: `now.getTime() + 14 * 24 * 60 * 60 * 1000`
- Days until end is calculated as: `Math.ceil((endDate - now) / (24 * 60 * 60 * 1000))`
- Minimum days until end is clamped to 1 to avoid division issues

## Open Questions

1. The algorithm does not use the vector embeddings stored on activities - recommendations are purely score-based rather than similarity-based
2. Geospatial proximity is not factored into the scoring (despite geospatial index being available)
3. No randomization or diversity mechanism exists - same inputs always produce same outputs
