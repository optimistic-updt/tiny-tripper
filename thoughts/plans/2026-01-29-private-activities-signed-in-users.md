# Private Activities for Signed-In Users - Implementation Plan

## Overview

Enable signed-in user features: the ability to set activities as private and set urgency on private activities. Show these controls to all users but disable them for non-authenticated users with a prompt to sign in, incentivizing account creation.

## Current State Analysis

### What Exists:
- **Authentication**: Clerk + Convex fully integrated, `ctx.auth.getUserIdentity()` works
- **Schema**: `isPublic` and `userId` fields exist on activities table
- **Privacy filtering**: `listActivities` and `getRecommendation` already filter by `isPublic === true OR userId === currentUser`
- **Create form**: Has public/private toggle but hardcoded to `checked={true}` (broken)
- **Urgency field**: Exists in schema but commented out in create form

### Key Issues:
1. `UserButton` is commented out - no way to log in (`app/tt/layout.tsx:13`)
2. Public/private toggle is broken - `checked={true}` hardcoded (`app/tt/create/page.tsx:170`)
3. Urgency selector is commented out (`app/tt/create/page.tsx:196-214`)
4. `getActivity` query has no permission check (security issue)

## Desired End State

After implementation:
1. Users see a login button in the header
2. All users see the public/private toggle and urgency selector
3. Non-authenticated users see these controls disabled with "Sign in to unlock" messaging
4. Authenticated users can toggle activities to private and set urgency
5. Private activities only visible to their owner
6. Direct access to private activities via `getActivity` is blocked for non-owners

## What We're NOT Doing

- No changes to the quiz flow
- No new database indexes (can add `by_userId` later if performance requires)
- No changes to `searchActivities` privacy (flagged as "all good for now" in research)
- No user profile page or settings
- No ability to edit existing activities' privacy

## Implementation Approach

Use Clerk's `useAuth` hook to detect authentication state in the create form. Conditionally enable/disable form controls and show appropriate messaging to drive signups.

---

## Phase 1: Enable Login UI

### Overview
Uncomment and configure the UserButton component so users can sign in.

### Changes Required:

#### 1. Enable UserButton in Layout

**File**: `app/tt/layout.tsx`

**Current code (line 13)**:
```tsx
{/* <UserButton /> */}
```

**Change to**:
```tsx
<SignedIn>
  <UserButton />
</SignedIn>
<SignedOut>
  <SignInButton mode="modal">
    <Button variant="soft" size="2">
      Sign In
    </Button>
  </SignInButton>
</SignedOut>
```

**Add imports at top**:
```tsx
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@radix-ui/themes";
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `pnpm run build`
- [x] Linting passes: `pnpm run lint`

#### Manual Verification:
- [ ] "Sign In" button appears in header when logged out
- [ ] Clicking "Sign In" opens Clerk modal
- [ ] After signing in, UserButton avatar appears
- [ ] Can sign out via UserButton menu

---

## Phase 2: Fix Public/Private Toggle with Auth Gating

### Overview
Make the public/private toggle functional and disable it for non-authenticated users with signup incentive messaging.

### Changes Required:

#### 1. Add Auth Hook and Conditional Rendering

**File**: `app/tt/create/page.tsx`

**Add imports**:
```tsx
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Lock } from "lucide-react";
```

**Add hook in component (after line 58)**:
```tsx
const { isSignedIn } = useAuth();
```

**Replace current toggle section (lines 167-182)**:

Current:
```tsx
<div>
  <Flex align="center" gap="3">
    <Switch
      checked={true}
      onCheckedChange={(checked) => setValue("isPublic", checked)}
    />
    <Text size="2" weight="medium">
      {isPublic ? "Public Activity" : "Private Activity"}
    </Text>
  </Flex>
  <Text size="1" color="gray" mt="1">
    {isPublic
      ? "Anyone can see this activity (currently only Public)"
      : "Only you can see this activity"}
  </Text>
</div>
```

Change to:
```tsx
<div style={{ opacity: !isSignedIn ? 0.5 : 1 }}>
  <Flex align="center" gap="3">
    {!isSignedIn && <Lock size={14} className="text-gray-400" />}
    <Switch
      checked={isPublic}
      onCheckedChange={(checked) => setValue("isPublic", checked)}
      disabled={!isSignedIn}
    />
    <Text size="2" weight="medium" color={!isSignedIn ? "gray" : undefined}>
      {isPublic ? "Public Activity" : "Private Activity"}
    </Text>
  </Flex>
  <Text size="1" color="gray" mt="1">
    {!isSignedIn ? (
      <SignInButton mode="modal">
        <span className="cursor-pointer underline hover:no-underline">
          Sign in to create private activities that only you can see
        </span>
      </SignInButton>
    ) : isPublic ? (
      <>Anyone can see this activity</>
    ) : (
      <>Only you can see this activity</>
    )}
  </Text>
</div>
```

#### 2. Update Default Values Based on Auth

**In the form defaultValues, change `isPublic` handling**:

The default should remain `true` for non-authenticated users (they can only create public activities).

**Update onSubmit to enforce public for non-authenticated (around line 107)**:
```tsx
isPublic: isSignedIn ? (data.isPublic ?? true) : true,
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `pnpm run build`
- [x] Linting passes: `pnpm run lint`

#### Manual Verification:
- [ ] When logged out: toggle is greyed out (50% opacity) with lock icon
- [ ] When logged out: "Sign in to create private activities..." is underlined and clickable
- [ ] Clicking the sign-in text opens the Clerk sign-in modal
- [ ] When logged in: toggle works at full opacity, no lock icon
- [ ] Creating activity while logged out always creates public activity
- [ ] Creating private activity while logged in: activity only visible to creator

---

## Phase 3: Enable Urgency Selector with Auth Gating

### Overview
Uncomment the urgency selector and gate it behind authentication like the privacy toggle.

### Changes Required:

#### 1. Uncomment and Gate Urgency Selector

**File**: `app/tt/create/page.tsx`

**Uncomment SegmentedControl import (line 16)**:
```tsx
import {
  // ... existing imports
  SegmentedControl,
} from "@radix-ui/themes";
```

**Replace commented urgency section (lines 196-214)** with:
```tsx
<Flex direction={"column"} style={{ opacity: !isSignedIn ? 0.5 : 1 }}>
  <Flex align="center" gap="2" mb="2">
    {!isSignedIn && <Lock size={14} className="text-gray-400" />}
    <Text size="2" weight="medium">
      Urgency
    </Text>
  </Flex>
  <SegmentedControl.Root
    defaultValue="medium"
    size="3"
    disabled={!isSignedIn}
    onValueChange={(value: "low" | "medium" | "high") =>
      setValue("urgency", value)
    }
  >
    <SegmentedControl.Item value="low">Low</SegmentedControl.Item>
    <SegmentedControl.Item value="medium">Medium</SegmentedControl.Item>
    <SegmentedControl.Item value="high">High</SegmentedControl.Item>
  </SegmentedControl.Root>
  <Text size="1" color="gray" mt="1">
    {!isSignedIn ? (
      <SignInButton mode="modal">
        <span className="cursor-pointer underline hover:no-underline">
          Sign in to set urgency and prioritize your activities
        </span>
      </SignInButton>
    ) : (
      <>Higher urgency activities appear first in recommendations</>
    )}
  </Text>
</Flex>
```

#### 2. Update onSubmit to Enforce Default Urgency for Non-Authenticated

**In onSubmit, only pass urgency if signed in**:
```tsx
urgency: isSignedIn ? (data.urgency || "medium") : undefined,
```

This lets the backend default to "medium" for non-authenticated users.

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `pnpm run build`
- [x] Linting passes: `pnpm run lint`

#### Manual Verification:
- [ ] When logged out: urgency selector is greyed out (50% opacity) with lock icon
- [ ] When logged out: "Sign in to set urgency..." is underlined and clickable
- [ ] Clicking the sign-in text opens the Clerk sign-in modal
- [ ] When logged in: urgency selector works at full opacity, no lock icon
- [ ] Activities created with high urgency appear first in recommendations

---

## Phase 4: Secure getActivity Query

### Overview
Add permission check to `getActivity` so private activities can't be accessed by non-owners.

### Changes Required:

#### 1. Add Permission Check

**File**: `convex/activities.ts`

**Replace getActivity (lines 173-180)**:

Current:
```typescript
export const getActivity = query({
  args: {
    id: v.id("activities"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

Change to:
```typescript
export const getActivity = query({
  args: {
    id: v.id("activities"),
  },
  returns: v.union(
    v.object({
      _id: v.id("activities"),
      _creationTime: v.number(),
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
          street_address: v.optional(v.string()),
          city: v.optional(v.string()),
          state_province: v.optional(v.string()),
          postal_code: v.optional(v.string()),
          country_code: v.optional(v.string()),
        }),
      ),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      isPublic: v.optional(v.boolean()),
      userId: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      embedding: v.optional(v.array(v.float64())),
      imageId: v.optional(v.id("_storage")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.id);

    if (!activity) {
      return null;
    }

    // Public activities are accessible to everyone
    if (activity.isPublic === true) {
      return activity;
    }

    // Private activities only accessible to owner
    const identity = await ctx.auth.getUserIdentity();
    if (activity.userId && activity.userId === identity?.subject) {
      return activity;
    }

    // Not authorized to view this activity
    return null;
  },
});
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `pnpm run build`
- [x] Convex deploys successfully: `pnpm run dev:backend` shows no errors

#### Manual Verification:
- [ ] Accessing a public activity by ID works for anyone
- [ ] Accessing own private activity by ID works
- [ ] Accessing someone else's private activity by ID returns null

---

## Testing Strategy

### Unit Tests:
- N/A - no test infrastructure exists in this project

### Integration Tests:
- N/A - no test infrastructure exists

### Manual Testing Steps:

1. **Test Login Flow**:
   - Visit /tt/create
   - Verify "Sign In" button in header
   - Click sign in, complete Clerk flow
   - Verify UserButton appears

2. **Test Public/Private Toggle**:
   - Logged out: verify toggle is greyed out with lock icon and clickable signup message
   - Click signup message: verify sign-in modal opens
   - Log in: verify toggle works (full opacity, no lock icon)
   - Create private activity
   - Log out: verify private activity not visible in /tt/activities
   - Log in: verify private activity visible

3. **Test Urgency Selector**:
   - Logged out: verify selector is greyed out with lock icon and clickable signup message
   - Click signup message: verify sign-in modal opens
   - Log in: verify selector works (full opacity, no lock icon)
   - Create activity with "high" urgency
   - Verify high urgency activities appear first in /tt/play

4. **Test getActivity Security**:
   - Create private activity while logged in
   - Copy activity ID
   - Log out
   - Try to access activity via direct API call (should return null)

## References

- Research document: `thoughts/research/2026-01-29-private-activities-for-logged-in-users.md`
- Auth configuration: `convex/auth.config.ts`
- Activity queries: `convex/activities.ts`
- Create form: `app/tt/create/page.tsx`
- Layout with UserButton: `app/tt/layout.tsx`
