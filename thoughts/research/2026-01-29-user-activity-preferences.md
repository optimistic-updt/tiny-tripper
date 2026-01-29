---
date: 2026-01-29T00:52:02Z
researcher: Claude
git_commit: 186138c452197470af893cd45266a136e97b7654
branch: main
repository: tiny-tripper
topic: "User-specific preferences for public activities (hide, deprioritize, prioritize)"
tags:
  [research, codebase, activities, preferences, recommendations, user-settings]
status: complete
last_updated: 2026-01-29
last_updated_by: Claude
last_updated_note: "Updated to use standard urgency levels (low/medium/high) instead of custom preference terms"
---

# Research: User-specific Preferences for Public Activities

**Date**: 2026-01-29T00:52:02Z
**Researcher**: Claude
**Git Commit**: 186138c452197470af893cd45266a136e97b7654
**Branch**: main
**Repository**: tiny-tripper

## Research Question

Activities can be public or private. As a user, I have limited control over public activities that I see. Maybe some of the activities are of no interest to me and I never want them recommended to me, or maybe I want to deprioritize or add urgency to some public activity just for myself.

How could this sort of feature be implemented?

## Summary

The codebase currently has no mechanism for users to store preferences about public activities. To implement user-specific preferences for public activities (hide, deprioritize, prioritize), a new `userActivityPreferences` table would need to be created. This table would store per-user overrides that the `getRecommendation` query would consult when filtering and scoring activities.

## Current Architecture

### Database Schema (convex/schema.ts)

**Existing tables:**

- `activities` - Core activity data with `isPublic` and `userId` fields
- `tags` - Tag definitions
- `scrapeWorkflows` - Web scraping workflow tracking
- `quizResponses` - Quiz submissions with user preferences

**No user preferences table exists.** User-specific data is limited to:

- `activities.userId` - Ownership of private activities
- `quizResponses.userId` - Quiz response association

### Recommendation Algorithm (convex/activities.ts:283-407)

The `getRecommendation` query currently:

1. Fetches all activities where `isPublic === true` OR `userId === currentUser`
2. Filters by `excludeIds`, expired `endDate`, and tag filters (`atHome`, `rainproof`)
3. Scores based on: urgency (100/50/10), end date proximity (80+), ownership (30), location (10), tags (5)
4. Applies optional random jitter (±20 points)
5. Returns highest-scored activity

**Key observation**: There is no user-specific scoring or filtering for public activities. All users see the same public activities with the same base scores.

### Current Filtering Capabilities

```typescript
// convex/activities.ts:312-343
.filter((activity) => {
  // 1. Exclude previously shown (session-based, not persistent)
  if (args.excludeIds?.includes(activity._id)) return false;

  // 2. Exclude expired
  if (activity.endDate && new Date(activity.endDate) < now) return false;

  // 3. Tag filters (atHome, rainproof)
  if (args.filters) {
    if (atHome && !tags.includes("at home")) return false;
    if (rainproof && !tags.includes("rain-approved")) return false;
  }
  return true;
})
```

## Proposed Implementation

### New Table: `userActivityPreferences`

Add to `convex/schema.ts`:

```typescript
userActivityPreferences: defineTable({
  userId: v.string(), // Clerk user ID
  activityId: v.id("activities"),
  hidden: v.optional(v.boolean()), // Never show this activity
  urgencyOverride: v.optional(
    // User's personal priority override
    v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  ),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_userId", ["userId"])
  .index("by_userId_and_activityId", ["userId", "activityId"]);
```

**Fields:**

- `hidden` - Boolean to hide the activity from recommendations
- `urgencyOverride` - User's personal priority (low/medium/high), overrides the activity's base urgency for scoring. Default is `medium` when not set.

**Index rationale:**

- `by_userId` - Fetch all preferences for a user (used in getRecommendation)
- `by_userId_and_activityId` - Check/update preference for specific activity

### Modified getRecommendation Query

The `getRecommendation` function would need to:

1. **Fetch user preferences** at the start:

```typescript
const preferences = await ctx.db
  .query("userActivityPreferences")
  .withIndex("by_userId", (q) => q.eq("userId", identity?.subject))
  .collect();

const prefsMap = new Map(preferences.map((p) => [p.activityId, p]));
```

2. **Filter hidden activities**:

```typescript
.filter((activity) => {
  // Existing filters...

  // NEW: Skip hidden activities
  const pref = prefsMap.get(activity._id);
  if (pref?.hidden) {
    return false;
  }
  return true;
})
```

3. **Apply urgency override in scoring**:

```typescript
.map((activity) => {
  let score = 0;

  // Priority 1: Urgency - use user's override if set, otherwise activity's base urgency
  const pref = prefsMap.get(activity._id);
  const effectiveUrgency = pref?.urgencyOverride ?? activity.urgency;

  if (effectiveUrgency === "high") {
    score += 100;
  } else if (effectiveUrgency === "medium") {
    score += 50;
  } else {
    score += 10; // low
  }

  // ... rest of existing scoring (end date, ownership, location, tags)

  return { ...activity, score };
})
```

### New Convex Functions

```typescript
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

// Get user's preferences for an activity
export const getActivityPreference = query({
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

### Frontend Integration Points

#### Activity Card UI (`app/tt/play/page.tsx`)

The activity card currently displays in a `Card` component with the activity name and a `Badge` showing urgency level (lines 148-231).

**1. Hide Button - Eye with Strike-through Icon**

Add an `IconButton` with an eye-off icon in the card header, next to the priority dropdown:

```tsx
import { EyeOff } from "lucide-react";
import { IconButton } from "@radix-ui/themes";
import { useMutation } from "convex/react";

// In component:
const setHidden = useMutation(api.userActivityPreferences.setActivityHidden);

// In the card header (lines 150-161), add after the priority dropdown:
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
</IconButton>;
```

**2. Priority Dropdown - Replace Static Badge**

The current urgency badge (lines 154-160) displays the activity's base urgency as a static `Badge`:

```tsx
// CURRENT (static):
<Badge
  size="2"
  color={getUrgencyColor(currentActivity.urgency)}
  className="ml-4"
>
  {currentActivity.urgency.toUpperCase()}
</Badge>
```

Replace with a `DropdownMenu` from Radix UI that allows users to set their personal priority override (low, medium, high):

```tsx
import { DropdownMenu } from "@radix-ui/themes";

// NEW (interactive dropdown):
const setUrgency = useMutation(api.userActivityPreferences.setActivityUrgency);

// Effective urgency: user's override if set, otherwise activity's base urgency
const effectiveUrgency =
  userPreference?.urgencyOverride ?? currentActivity.urgency;

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Button
      size="2"
      variant="soft"
      color={getUrgencyColor(effectiveUrgency)}
      className="ml-4"
    >
      {effectiveUrgency.toUpperCase()}
      <DropdownMenu.TriggerIcon />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item
      onClick={() =>
        setUrgency({ activityId: currentActivity._id, urgency: "high" })
      }
    >
      High
    </DropdownMenu.Item>
    <DropdownMenu.Item
      onClick={() =>
        setUrgency({ activityId: currentActivity._id, urgency: "medium" })
      }
    >
      Medium
    </DropdownMenu.Item>
    <DropdownMenu.Item
      onClick={() =>
        setUrgency({ activityId: currentActivity._id, urgency: "low" })
      }
    >
      Low
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item
      onClick={() =>
        setUrgency({ activityId: currentActivity._id, urgency: null })
      }
    >
      Reset to default ({currentActivity.urgency})
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>;
```

**3. Updated Card Header Layout**

The full card header section (lines 150-161) would become:

```tsx
const setHidden = useMutation(api.userActivityPreferences.setActivityHidden);
const setUrgency = useMutation(api.userActivityPreferences.setActivityUrgency);
const userPreference = useQuery(
  api.userActivityPreferences.getActivityPreference,
  currentActivity ? { activityId: currentActivity._id } : "skip",
);

const effectiveUrgency =
  userPreference?.urgencyOverride ?? currentActivity.urgency;

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
          color={getUrgencyColor(effectiveUrgency)}
        >
          {effectiveUrgency.toUpperCase()}
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item
          onClick={() =>
            setUrgency({ activityId: currentActivity._id, urgency: "high" })
          }
        >
          High
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onClick={() =>
            setUrgency({ activityId: currentActivity._id, urgency: "medium" })
          }
        >
          Medium
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onClick={() =>
            setUrgency({ activityId: currentActivity._id, urgency: "low" })
          }
        >
          Low
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onClick={() =>
            setUrgency({ activityId: currentActivity._id, urgency: null })
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
</div>;
```

#### Activity List Page (`app/tt/activities/page.tsx`)

- Show preference indicators on activity cards (e.g., small icon or badge showing "Hidden", "Prioritized", etc.)
- Allow preference management from list view using the same dropdown pattern

## Code References

- `convex/schema.ts:5-36` - Activities table definition
- `convex/activities.ts:283-407` - getRecommendation query with scoring logic
- `convex/activities.ts:155-171` - listActivities query
- `convex/activities.ts:312-343` - Current filtering logic
- `convex/activities.ts:344-388` - Current scoring logic
- `app/tt/play/page.tsx:148-231` - Activity card display component
- `app/tt/play/page.tsx:150-161` - Card header with name and urgency badge (to be modified)
- `app/tt/play/page.tsx:154-160` - Current static urgency Badge (to become dropdown)

## Architecture Considerations

1. **Query Performance**: Fetching all user preferences on each recommendation call adds one indexed query. With proper indexing on `by_userId`, this should remain fast.

2. **Preference Persistence**: Unlike `excludeIds` which is session-based, preferences persist across sessions.

3. **Public vs Private**: This feature only makes sense for public activities. Users already have full control over their private activities.

4. **Preference Conflicts**: If a user marks an activity as both `hidden` and `prioritized` (via bugs/race conditions), `hidden` should take precedence in the filter step.

5. **listActivities Impact**: The `listActivities` query may also need to respect `hidden` preferences, or a new `listVisibleActivities` query could be created.

## Related Research

- `thoughts/research/2026-01-28-get-recommendation-algorithm.md` - Detailed algorithm documentation
- `thoughts/research/2026-01-29-private-activities-for-logged-in-users.md` - Private activities feature

## Open Questions

1. Should hidden activities be completely invisible, or should there be a "Show hidden" toggle?
   in the list page, we can have a toggle

2. Should preference changes be tracked for analytics/ML training?
   no
3. Should there be a bulk preference reset option?
   no

4. Should preferences propagate to similar activities (via embeddings)?
   no
