# User Activity Preferences Implementation Plan

## Overview

Implement user-specific preferences for public activities, allowing users to hide activities they're not interested in and override the urgency level (low/medium/high) for personalized recommendation scoring.

## Current State Analysis

The codebase currently has no mechanism for users to store preferences about public activities. The `getRecommendation` query treats all public activities identically for all users - everyone sees the same activities with the same base scores.

### Key Discoveries:

- **No user preferences table exists** - User-specific data is limited to `activities.userId` (ownership) and `quizResponses.userId` (`convex/schema.ts:5-125`)
- **Urgency scoring uses fixed values** - High=100, Medium=50, Low=10 points (`convex/activities.ts:347-354`)
- **Urgency display is static** - The Badge component shows activity's base urgency with no user interaction (`app/tt/play/page.tsx:154-160`)
- **Existing upsert pattern** - Tags use find-or-create pattern with `.first()` (`convex/tags.ts:38-66`)
- **IconButton pattern exists** - Navbar uses IconButton from Radix UI (`app/tt/Navbar.tsx:31-45`)

## Desired End State

Users can:
1. **Hide activities** - Click an eye-off icon to permanently hide an activity from their recommendations
2. **Override urgency** - Click a dropdown to set their personal priority (low/medium/high) for any activity, overriding the activity's base urgency in scoring

The recommendation algorithm will:
1. Filter out activities the user has marked as hidden
2. Use the user's urgency override (if set) instead of the activity's base urgency when calculating scores

### Verification:
- Hidden activities never appear in recommendations for that user
- Urgency override affects scoring (visible in the "Recommendation Score" display)
- Preferences persist across sessions
- Other users are unaffected by one user's preferences

## What We're NOT Doing

- Bulk preference management UI
- "Show hidden" toggle on the list page
- Analytics/ML tracking of preference changes
- Propagating preferences to similar activities via embeddings
- Modifying the `listActivities` query (can be done later if needed)

## Implementation Approach

Create a new `userActivityPreferences` table with composite indexes, add backend functions for CRUD operations, modify the recommendation query to respect preferences, and update the Play page UI with interactive controls.

---

## Phase 1: Database Schema

### Overview

Add the `userActivityPreferences` table to store per-user overrides for activities.

### Changes Required:

#### 1. Schema Definition

**File**: `convex/schema.ts`
**Changes**: Add new table definition after the `quizResponses` table (after line 124)

```typescript
  userActivityPreferences: defineTable({
    userId: v.string(), // Clerk user ID
    activityId: v.id("activities"),
    hidden: v.optional(v.boolean()), // Never show this activity
    urgencyOverride: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_activityId", ["userId", "activityId"]),
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles without errors: `pnpm run typecheck`
- [ ] Convex schema pushes successfully: `pnpm run dev:backend` (check for schema sync)
- [x] No linting errors: `pnpm run lint`

#### Manual Verification:

- [x] Convex dashboard shows the new `userActivityPreferences` table with correct indexes

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the schema deployed correctly before proceeding to the next phase.

---

## Phase 2: Backend Functions

### Overview

Add Convex mutations and queries to manage user preferences.

### Changes Required:

#### 1. New File for User Preferences

**File**: `convex/userActivityPreferences.ts`
**Changes**: Create new file with the following functions

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Set activity as hidden/visible
export const setActivityHidden = mutation({
  args: {
    activityId: v.id("activities"),
    hidden: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userActivityPreferences")
      .withIndex("by_userId_and_activityId", (q) =>
        q.eq("userId", identity.subject).eq("activityId", args.activityId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        hidden: args.hidden,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userActivityPreferences", {
        userId: identity.subject,
        activityId: args.activityId,
        hidden: args.hidden,
        createdAt: Date.now(),
      });
    }
    return null;
  },
});

// Set user's urgency override for an activity
export const setActivityUrgency = mutation({
  args: {
    activityId: v.id("activities"),
    urgency: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.null(), // Reset to activity's default
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userActivityPreferences")
      .withIndex("by_userId_and_activityId", (q) =>
        q.eq("userId", identity.subject).eq("activityId", args.activityId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        urgencyOverride: args.urgency ?? undefined,
        updatedAt: Date.now(),
      });
    } else if (args.urgency !== null) {
      await ctx.db.insert("userActivityPreferences", {
        userId: identity.subject,
        activityId: args.activityId,
        urgencyOverride: args.urgency,
        createdAt: Date.now(),
      });
    }
    return null;
  },
});

// Get user's preference for a specific activity
export const getActivityUserPreference = query({
  args: { activityId: v.id("activities") },
  returns: v.union(
    v.object({
      hidden: v.optional(v.boolean()),
      urgencyOverride: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const pref = await ctx.db
      .query("userActivityPreferences")
      .withIndex("by_userId_and_activityId", (q) =>
        q.eq("userId", identity.subject).eq("activityId", args.activityId),
      )
      .unique();

    if (!pref) return null;
    return {
      hidden: pref.hidden,
      urgencyOverride: pref.urgencyOverride,
    };
  },
});
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles without errors: `pnpm run typecheck`
- [x] No linting errors: `pnpm run lint`
- [x] Functions appear in Convex dashboard

#### Manual Verification:

- [x] Test `setActivityHidden` via Convex dashboard: creates preference record
- [x] Test `setActivityUrgency` via Convex dashboard: creates/updates urgency override
- [x] Test `getActivityUserPreference` via Convex dashboard: returns correct preference
- [x] Upsert works correctly: calling mutation twice updates existing record

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the functions work correctly before proceeding to the next phase.

---

## Phase 3: Modify getRecommendation Query

### Overview

Update the recommendation algorithm to fetch user preferences, filter hidden activities, and apply urgency overrides in scoring.

### Changes Required:

#### 1. Fetch User Preferences

**File**: `convex/activities.ts`
**Changes**: After getting identity (line 295), fetch all user preferences

```typescript
// Add after line 297 (after twoWeeksFromNow declaration)
// Fetch user preferences for filtering and scoring
const preferences = identity
  ? await ctx.db
      .query("userActivityPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect()
  : [];

const prefsMap = new Map(preferences.map((p) => [p.activityId.toString(), p]));
```

#### 2. Filter Hidden Activities

**File**: `convex/activities.ts`
**Changes**: Add hidden filter in the filter chain (after line 324, before tag filters)

```typescript
// Add after the endDate filter block (after line 324)
// Filter out activities hidden by the user
const pref = prefsMap.get(activity._id.toString());
if (pref?.hidden) {
  return false;
}
```

#### 3. Apply Urgency Override in Scoring

**File**: `convex/activities.ts`
**Changes**: Modify the urgency scoring section (lines 347-354) to use override

Replace:
```typescript
// Priority 1: Urgency (highest weight)
if (activity.urgency === "high") {
  score += 100;
} else if (activity.urgency === "medium") {
  score += 50;
} else {
  score += 10;
}
```

With:
```typescript
// Priority 1: Urgency (highest weight) - use user's override if set
const pref = prefsMap.get(activity._id.toString());
const effectiveUrgency = pref?.urgencyOverride ?? activity.urgency;

if (effectiveUrgency === "high") {
  score += 100;
} else if (effectiveUrgency === "medium") {
  score += 50;
} else {
  score += 10;
}
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles without errors: `pnpm run typecheck`
- [x] No linting errors: `pnpm run lint`

#### Manual Verification:

- [x] Create a preference with `hidden: true` via dashboard, verify activity no longer appears in recommendations
- [x] Create a preference with `urgencyOverride: "high"` for a low-urgency activity, verify score increases
- [x] Verify unauthenticated users still see all public activities (no filtering)
- [x] Verify other users are unaffected by one user's preferences

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the recommendation algorithm respects preferences before proceeding to the next phase.

---

## Phase 4: Frontend UI

### Overview

Replace the static urgency Badge with a DropdownMenu for urgency override, and add a hide IconButton.

### Changes Required:

#### 1. Add Imports

**File**: `app/tt/play/page.tsx`
**Changes**: Add imports at the top of the file

```typescript
// Add to existing imports from "@radix-ui/themes" (line 5-15)
import { DropdownMenu, IconButton } from "@radix-ui/themes";

// Add new imports
import { EyeOff } from "lucide-react";
import { useMutation } from "convex/react";
```

#### 2. Add Mutations and Preference Query

**File**: `app/tt/play/page.tsx`
**Changes**: Add after the `recommendation` query (after line 65)

```typescript
// Mutations for user preferences
const setHidden = useMutation(api.userActivityPreferences.setActivityHidden);
const setUrgency = useMutation(api.userActivityPreferences.setActivityUrgency);

// Get user's preference for current activity
const userPreference = useQuery(
  api.userActivityPreferences.getActivityUserPreference,
  currentActivity ? { activityId: currentActivity._id } : "skip",
);
```

#### 3. Replace Static Badge with Dropdown and Add Hide Button

**File**: `app/tt/play/page.tsx`
**Changes**: Replace the card header section (lines 150-161) with:

```tsx
<div className="flex items-start justify-between">
  <Heading as="h2" size="6" className="flex-1">
    {currentActivity.name}
  </Heading>
  <Flex gap="2" align="center">
    {/* Priority Dropdown */}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button
          size="2"
          variant="soft"
          color={getUrgencyColor(
            userPreference?.urgencyOverride ?? currentActivity.urgency,
          )}
        >
          {(
            userPreference?.urgencyOverride ?? currentActivity.urgency
          ).toUpperCase()}
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onSelect={() =>
            setUrgency({
              activityId: currentActivity._id,
              urgency: "high",
            })
          }
        >
          High
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={() =>
            setUrgency({
              activityId: currentActivity._id,
              urgency: "medium",
            })
          }
        >
          Medium
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={() =>
            setUrgency({
              activityId: currentActivity._id,
              urgency: "low",
            })
          }
        >
          Low
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onSelect={() =>
            setUrgency({
              activityId: currentActivity._id,
              urgency: null,
            })
          }
        >
          Reset to default ({currentActivity.urgency})
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    {/* Hide Button */}
    <IconButton
      size="2"
      variant="ghost"
      color="gray"
      onClick={() =>
        setHidden({
          activityId: currentActivity._id,
          hidden: true,
        })
      }
      title="Hide this activity"
    >
      <EyeOff size={16} />
    </IconButton>
  </Flex>
</div>
```

#### 4. Add Button Import

**File**: `app/tt/play/page.tsx`
**Changes**: Ensure `Button` is in the Radix imports (it's already imported at line 6)

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compiles without errors: `pnpm run typecheck`
- [x] No linting errors: `pnpm run lint`
- [x] Build succeeds: `pnpm run build`

#### Manual Verification:

- [ ] Urgency dropdown displays current effective urgency (override or base)
- [ ] Clicking dropdown item changes urgency and updates display
- [ ] "Reset to default" option shows base urgency and clears override
- [ ] Hide button (eye-off icon) appears and is clickable
- [ ] Clicking hide button removes activity from recommendations immediately
- [ ] Changes persist across page refreshes
- [ ] Unauthenticated users see static badge (no dropdown/hide button) - or gracefully handle auth errors

**Implementation Note**: After completing this phase and all automated verification passes, the feature is complete. Perform full end-to-end testing.

---

## Testing Strategy

### Unit Tests:

Not adding unit tests for this feature as the codebase doesn't have a testing setup. The Convex functions can be tested via the dashboard.

### Integration Tests:

N/A - no integration test framework in place.

### Manual Testing Steps:

1. Log in as a user
2. Navigate to Play page and get a recommendation
3. Click urgency dropdown, change to "High" - verify badge color changes to red
4. Click "Let's Play" to get next recommendation
5. Return to first activity (use back button) - verify urgency is still "High"
6. Click "Reset to default" - verify original urgency is restored
7. Click hide button (eye-off icon) on an activity
8. Verify that activity never appears again in recommendations
9. Log in as a different user - verify they still see the hidden activity
10. Log out - verify recommendations still work (graceful handling)

## Performance Considerations

- **Query overhead**: Fetching all user preferences adds one indexed query per recommendation. With proper `by_userId` index, this remains fast even with many preferences.
- **Map lookup**: Using a Map for O(1) preference lookups by activity ID.
- **No N+1**: Preferences are fetched once and reused for all activities in the filter/score loop.

## Migration Notes

No data migration needed. The new table starts empty and preferences are created on-demand when users interact with the UI.

## References

- Original research: `thoughts/research/2026-01-29-user-activity-preferences.md`
- Related research: `thoughts/research/2026-01-28-get-recommendation-algorithm.md`
- Schema: `convex/schema.ts:5-125`
- Recommendation query: `convex/activities.ts:283-407`
- Play page UI: `app/tt/play/page.tsx:148-231`
