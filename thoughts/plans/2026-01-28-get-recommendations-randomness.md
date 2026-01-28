# getRecommendations Randomness Implementation Plan

## Overview

Add randomness to the `getRecommendation` endpoint using score jitter with a client-provided seed to keep users excited and engaged. Currently, the algorithm is deterministic - same inputs always produce the same output. This change introduces pleasant surprise while maintaining the spirit of the scoring system.

## Current State Analysis

**Location**: `convex/activities.ts:227-337`

The current implementation:
1. Retrieves all accessible activities (public + user-owned)
2. Filters out excluded IDs, expired activities, and tag mismatches
3. Scores activities deterministically (urgency, end date, ownership, location, tags)
4. Returns the highest-scoring activity

**Problem**: The research document (`thoughts/research/2026-01-28-get-recommendation-algorithm.md`) notes: "No randomization or diversity mechanism exists - same inputs always produce same outputs"

**Score Range**:
- Minimum: 10 points (low urgency, no other attributes)
- Maximum: 244 points (high urgency + expiring tomorrow + owned + location + tags)

## Desired End State

After implementation:
1. The `getRecommendation` endpoint accepts an optional `randomSeed` parameter
2. When a seed is provided, scores have random jitter applied (±20 points) before sorting
3. High-priority activities still win most of the time, but users occasionally see variety
4. Frontend generates a new random seed on each "Let's Play" click
5. Same seed + same filters = same result (reproducibility for debugging)

### Verification:
- Calling the endpoint multiple times with different seeds returns different top recommendations (when multiple activities have close scores)
- Calling with the same seed returns the same result
- High-urgency, time-sensitive activities still appear frequently

## What We're NOT Doing

- NOT changing the base scoring weights
- NOT adding embedding-based similarity recommendations
- NOT adding geospatial proximity scoring
- NOT persisting randomness state server-side
- NOT adding user preference learning

## Implementation Approach

Use a seeded pseudo-random number generator (PRNG) to add jitter to scores. The seed is provided by the client, ensuring:
- Deterministic results for the same seed (testable, debuggable)
- New randomness when the user requests a new recommendation
- Convex query compatibility (pure functions)

We'll use a simple mulberry32 PRNG which is small, fast, and produces good distribution.

---

## Phase 1: Backend - Add Randomness to getRecommendation

### Overview
Add `randomSeed` parameter and implement seeded random jitter on activity scores.

### Changes Required:

#### 1. Add seeded PRNG utility function

**File**: `convex/activities.ts`
**Changes**: Add a seeded random number generator function before `getRecommendation`

```typescript
// Seeded pseudo-random number generator (mulberry32)
// Returns a function that generates random numbers between 0 and 1
function createSeededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

#### 2. Update getRecommendation args

**File**: `convex/activities.ts`
**Changes**: Add `randomSeed` to the args validator

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
    randomSeed: v.optional(v.number()),
  },
  // ... handler
});
```

#### 3. Apply jitter to scores when seed is provided

**File**: `convex/activities.ts`
**Changes**: Modify the scoring/sorting logic to apply jitter

After scoring but before sorting, apply jitter if `randomSeed` is provided:

```typescript
// Inside handler, after .map() creates scoredActivities array

// Apply random jitter to scores if seed is provided
const JITTER_MAGNITUDE = 20; // ±20 points
if (args.randomSeed !== undefined) {
  const random = createSeededRandom(args.randomSeed);
  for (const activity of scoredActivities) {
    // Jitter between -JITTER_MAGNITUDE and +JITTER_MAGNITUDE
    const jitter = (random() * 2 - 1) * JITTER_MAGNITUDE;
    activity.score += jitter;
  }
}

// Then sort
scoredActivities.sort((a, b) => b.score - a.score);
```

#### 4. Update algorithm documentation comment

**File**: `convex/activities.ts`
**Changes**: Update the comment block at lines 214-226

```typescript
// getRecommendation prioritizes activities based on:
// 1. Urgency Level (100/50/10 points)
// 2. End Date within 2 weeks (80+ points, bonus for sooner deadlines)
// 3. User's own activities (30 points)
// 4. Activities with location (10 points)
// 5. Activities with tags (5 points)
//
// When randomSeed is provided, adds ±20 points of jitter to each score
// for variety while maintaining general priority ordering.
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `pnpm convex dev` starts successfully
- [x] Linting passes: `pnpm lint`

#### Manual Verification:
- [x] Calling `getRecommendation` with different `randomSeed` values returns different results (when multiple activities have similar scores)
- [x] Calling with same `randomSeed` returns the same result
- [x] High-urgency activities still tend to appear at the top

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the backend changes work correctly before proceeding to Phase 2.

---

## Phase 2: Frontend - Pass Random Seed

### Overview
Update the frontend to generate and pass a new random seed when the user clicks "Let's Play" to get a new recommendation.

### Changes Required:

#### 1. Add randomSeed state

**File**: `app/tt/play/page.tsx`
**Changes**: Add state for the random seed, initialized to a random value

```typescript
const [randomSeed, setRandomSeed] = useState(() => Math.floor(Math.random() * 1000000));
```

#### 2. Pass randomSeed to the query

**File**: `app/tt/play/page.tsx`
**Changes**: Update the useQuery call to include randomSeed

```typescript
const recommendation = useQuery(api.activities.getRecommendation, {
  excludeIds: excludeIds,
  filters: filters,
  randomSeed: randomSeed,
});
```

#### 3. Generate new seed on "Let's Play" click

**File**: `app/tt/play/page.tsx`
**Changes**: Update `handlePlayClick` to generate a new random seed

```typescript
const handlePlayClick = () => {
  if (recommendation) {
    // Add current recommendation to history
    const newHistory = [
      ...recommendationHistory.slice(0, currentIndex + 1),
      recommendation,
    ];
    setRecommendationHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);

    // Add current recommendation to exclude list for next query
    setExcludeIds((prev) => [...prev, recommendation._id]);

    // Generate new random seed for next recommendation
    setRandomSeed(Math.floor(Math.random() * 1000000));
  }
};
```

#### 4. Reset seed when filters change

**File**: `app/tt/play/page.tsx`
**Changes**: Update the filters useEffect to also reset the seed

```typescript
// Save filters to sessionStorage when they change
useEffect(() => {
  sessionStorage.setItem("activity-filters", JSON.stringify(filters));
  // Reset recommendation history and excludeIds when filters change
  setRecommendationHistory([]);
  setCurrentIndex(-1);
  setExcludeIds([]);
  // Generate new random seed
  setRandomSeed(Math.floor(Math.random() * 1000000));
}, [filters]);
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `pnpm dev:frontend` starts successfully
- [x] Linting passes: `pnpm lint`
- [ ] No console errors in browser

#### Manual Verification:
- [ ] Clicking "Let's Play" shows varied recommendations over multiple sessions
- [ ] High-priority activities still appear frequently
- [ ] Navigation history (back button) still works correctly
- [ ] Filter changes properly reset state and show new recommendations

**Implementation Note**: After completing this phase, perform full end-to-end testing to verify the user experience feels more engaging.

---

## Testing Strategy

### Unit Tests:
- Test that `createSeededRandom` produces consistent output for the same seed
- Test that different seeds produce different sequences

### Integration Tests:
- Test `getRecommendation` returns different results for different seeds (when activities have similar scores)
- Test `getRecommendation` returns same result for same seed
- Test that urgency ordering is generally preserved

### Manual Testing Steps:
1. Create several activities with similar scores (all medium urgency, no end dates)
2. Call "Let's Play" multiple times and verify you see different activities
3. Create a high-urgency activity and verify it still appears frequently
4. Test with filters enabled to ensure randomness works with filtered results

## Performance Considerations

- The PRNG is O(1) per call, negligible overhead
- Jitter is applied in-memory after filtering, no additional database queries
- No server-side state storage required

## Migration Notes

- No database migration required
- The `randomSeed` parameter is optional, so existing API calls continue to work
- Frontend changes are purely additive

## References

- Research document: `thoughts/research/2026-01-28-get-recommendation-algorithm.md`
- Current implementation: `convex/activities.ts:227-337`
- Frontend usage: `app/tt/play/page.tsx:56-59`
