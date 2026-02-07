---
date: 2026-02-04T12:00:00-08:00
researcher: Claude
git_commit: 06e0c0fcaf910411554f854d089fdebf8d487da3
branch: chore/move-to-tanstack
repository: tiny-tripper
topic: "Next.js to TanStack Start Migration Research"
tags: [research, migration, nextjs, tanstack-start, convex, clerk]
status: complete
last_updated: 2026-02-04
last_updated_by: Claude
---

# Research: Next.js to TanStack Start Migration Research

**Date**: 2026-02-04T12:00:00-08:00
**Researcher**: Claude
**Git Commit**: 06e0c0fcaf910411554f854d089fdebf8d487da3
**Branch**: chore/move-to-tanstack
**Repository**: tiny-tripper

## Research Question

Document the current Next.js codebase structure to understand what needs to be migrated to TanStack Start, using the provided migration documentation.

## Summary

This document provides a comprehensive analysis of the current Next.js 15 application structure to support migration to TanStack Start. The application uses Convex for backend, Clerk for authentication, PostHog for analytics, and Radix UI/Tailwind CSS 4 for styling. All pages are client-side rendered using Convex React hooks, which simplifies the migration since TanStack Start with Convex uses a similar pattern.

## Migration Reference Documentation

### TanStack Start Migration Guide
- Source: https://tanstack.com/start/latest/docs/framework/react/migrate-from-next-js

### Convex + TanStack Start Integration
- Source: https://docs.convex.dev/client/tanstack/tanstack-start/
- Key points:
  - Uses React Query integration for live-updating queries
  - Subscription session resumption from SSR to live on client
  - Use `useSuspenseQuery()` for SSR
  - Route loaders can prefetch with `queryClient.ensureQueryData(convexQuery(api.messages.list, {}))`

### Convex + TanStack Start + Clerk Integration
- Source: https://docs.convex.dev/client/tanstack/tanstack-start/clerk
- Key integration steps:
  1. Get Clerk ID token: `await auth.getToken({ template: "convex" })`
  2. Set token in router `beforeLoad`: `ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)`
  3. Use `ConvexProviderWithClerk` wrapper
  4. Router setup needs `ConvexReactClient`, `ConvexQueryClient`, and `QueryClient`

### Hosting Guide
- Source: https://tanstack.com/start/latest/docs/framework/react/guide/hosting

---

## Current Application Structure

### Technology Stack

| Component | Current (Next.js) | Target (TanStack) |
|-----------|------------------|-------------------|
| Framework | Next.js 15.2.8 | TanStack Start |
| React | React 19.2.4 | React 19 (compatible) |
| Routing | App Router | TanStack Router |
| Backend | Convex 1.31.7 | Convex (unchanged) |
| Auth | Clerk (@clerk/nextjs) | Clerk (@clerk/tanstack-start) |
| Styling | Tailwind CSS 4 | Tailwind CSS 4 (unchanged) |
| UI Library | Radix UI Themes | Radix UI Themes (unchanged) |
| Analytics | PostHog | PostHog (unchanged) |
| Forms | React Hook Form + Zod | React Hook Form + Zod (unchanged) |

### Package Dependencies to Change

**Remove:**
- `@clerk/nextjs` → Replace with `@clerk/tanstack-start`
- `next` → Replace with TanStack packages

**Add:**
- `@tanstack/react-router`
- `@tanstack/start`
- `@tanstack/react-query` (for Convex integration)
- `@convex-dev/react-query` (Convex TanStack Query adapter)
- `@clerk/tanstack-start`
- `vinxi` (TanStack Start build tool)

**Keep unchanged:**
- All Convex packages
- All Radix UI packages
- PostHog packages
- React Hook Form + Zod
- Tailwind CSS packages
- Google Maps packages
- OpenAI package

---

## File-by-File Migration Map

### Configuration Files

| Current File | Action | Notes |
|--------------|--------|-------|
| `next.config.mjs` | Replace | Create `app.config.ts` for TanStack |
| `tsconfig.json` | Modify | Update module settings for TanStack |
| `postcss.config.mjs` | Keep | No changes needed |
| `middleware.ts` | Remove | Clerk middleware works differently in TanStack |
| `env.ts` | Modify | Update to use TanStack env patterns |
| `package.json` | Modify | Update dependencies and scripts |

### Current Next.js Config (`next.config.mjs`)
```javascript
// PostHog proxy rewrites
rewrites: [
  { source: '/ingest/static/:path*', destination: 'https://eu-assets.i.posthog.com/static/:path*' },
  { source: '/ingest/:path*', destination: 'https://eu.i.posthog.com/:path*' }
]
skipTrailingSlashRedirect: true
```
These rewrites need to be recreated in TanStack Start server configuration.

### Route Migration Map

| Next.js Route | File Path | TanStack Route |
|---------------|-----------|----------------|
| `/` | `app/page.tsx` | `app/routes/index.tsx` |
| `/quiz` | `app/quiz/page.tsx` | `app/routes/quiz/index.tsx` |
| `/quiz/results` | `app/quiz/results/page.tsx` | `app/routes/quiz/results.tsx` |
| `/tt/play` | `app/tt/play/page.tsx` | `app/routes/tt/play.tsx` |
| `/tt/create` | `app/tt/create/page.tsx` | `app/routes/tt/create.tsx` |
| `/tt/activities` | `app/tt/activities/page.tsx` | `app/routes/tt/activities.tsx` |
| `/privacy` | (referenced but not found) | `app/routes/privacy.tsx` |

### Layout Migration

| Next.js Layout | TanStack Equivalent |
|----------------|---------------------|
| `app/layout.tsx` | `app/routes/__root.tsx` |
| `app/quiz/layout.tsx` | `app/routes/quiz.tsx` (layout route) |
| `app/tt/layout.tsx` | `app/routes/tt.tsx` (layout route) |

---

## Detailed Current Implementation

### Root Layout (`app/layout.tsx`)

**Provider Hierarchy (outermost to innermost):**
1. `PostHogProvider` - Analytics
2. `ClerkProvider` (with `dynamic` prop) - Authentication
3. `ConvexClientProvider` - Database
4. `Theme` (Radix) - UI theming

**Metadata:**
```typescript
title: "Tiny Tripper"
description: "Recommend the BEST activity to do with your kids based on your location."
icon: "/convex.svg"
manifest: "/manifest.json"
```

**Fonts:**
- Geist Sans (`--font-geist-sans`)
- Geist Mono (`--font-geist-mono`)

### Convex Client Provider (`components/ConvexClientProvider.tsx`)

```typescript
const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export default function ConvexClientProvider({ children }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
```

**Migration Note:** This needs to change to use TanStack Query integration:
```typescript
// New pattern for TanStack Start
const convexClient = new ConvexReactClient(env.VITE_CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convexClient);
const queryClient = new QueryClient();
convexQueryClient.connect(queryClient);
```

### PostHog Provider (`components/PostHogProvider.tsx`)

```typescript
posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: "/ingest",  // Uses proxy
  ui_host: "https://eu.posthog.com",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development"
});
```

**Migration Note:** The `/ingest` proxy path needs to be configured in TanStack Start's server config.

### Middleware (`middleware.ts`)

```typescript
const isProtectedRoute = createRouteMatcher(["/server"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});
```

**Migration Note:** TanStack Start handles route protection differently, using `beforeLoad` hooks in route definitions.

### Environment Variables (`env.ts`)

**Client-side variables (NEXT_PUBLIC_ prefix):**
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

**Migration Note:** TanStack Start uses `VITE_` prefix for client-side env vars.

---

## Page Components Analysis

### Home Page (`app/page.tsx`)
- **Type:** Client component ("use client")
- **Dependencies:** PostHog for A/B testing, Radix UI, Lucide icons
- **Data Fetching:** None (static content with feature flag)
- **Migration Complexity:** Low - purely client-side

### Quiz Page (`app/quiz/page.tsx`)
- **Type:** Client component
- **Dependencies:** Convex mutations, PostHog tracking, React Hook Form
- **Data Fetching:** Convex mutation on submit
- **Components Used:** BinaryQuestion, TextQuestion, SelectQuestion, ContactCapture, QuizStepper
- **Migration Complexity:** Low - client-side with mutations

### Quiz Results (`app/quiz/results/page.tsx`)
- **Type:** Client component
- **Dependencies:** Convex query, PostHog tracking
- **Data Fetching:** `useQuery(api.quiz.getQuizResponse, { responseId })`
- **Migration Complexity:** Low - single query

### Play Page (`app/tt/play/page.tsx`)
- **Type:** Client component
- **Dependencies:** Convex queries/mutations, Geolocation API, Clerk auth
- **Data Fetching:**
  - `useQuery(api.activities.getRecommendation, { excludeIds, filters, ... })`
  - `useQuery(api.userActivityPreferences.getActivityUserPreference, { activityId })`
  - `useMutation(api.userActivityPreferences.setActivityHidden)`
  - `useMutation(api.userActivityPreferences.setActivityUrgency)`
- **Migration Complexity:** Medium - complex state management

### Create Page (`app/tt/create/page.tsx`)
- **Type:** Client component
- **Dependencies:** Convex mutations, React Hook Form, Clerk auth, Google Places
- **Data Fetching:**
  - `useMutation(api.activities.generateUploadUrl)`
  - `useAction(api.activities.createActivity)`
- **Components Used:** TagCombobox, GooglePlacesAutocomplete, ImageUpload
- **Migration Complexity:** Medium - form with file upload

### Activities Page (`app/tt/activities/page.tsx`)
- **Type:** Client component
- **Dependencies:** Convex query
- **Data Fetching:** `useQuery(api.activities.listActivities)`
- **Migration Complexity:** Low - simple list

---

## Components Migration

### Provider Components (Need Changes)

| Component | Migration Notes |
|-----------|-----------------|
| `ConvexClientProvider.tsx` | Major rewrite - integrate with TanStack Query |
| `PostHogProvider.tsx` | Minor changes - same initialization pattern |

### UI Components (No Changes Needed)

These components use only Radix UI, Tailwind, and React hooks:
- `QuizStepper.tsx`
- `quiz/BinaryQuestion.tsx`
- `quiz/TextQuestion.tsx`
- `quiz/SelectQuestion.tsx`
- `quiz/ContactCapture.tsx`
- `quiz/Thermometer.tsx`

### Components with Convex Integration (Minor Changes)

These use Convex hooks which work the same way:
- `TagCombobox.tsx` - Uses `useQuery`, `useMutation`
- `ImageUpload.tsx` - Uses `useMutation`
- `SearchBar.tsx` - Uses `useAction`
- `ActivityListPrefetch.tsx` - Uses `useQuery`

### External API Components (No Changes)

- `GooglePlacesAutocomplete.tsx` - Pure Google Maps API integration

---

## Convex Backend (No Changes Required)

The entire `convex/` directory remains unchanged:
- `schema.ts` - Database schema
- `activities.ts` - Activity functions
- `tags.ts` - Tag management
- `quiz.ts` - Quiz functions
- `userActivityPreferences.ts` - User preferences
- All other backend files

---

## Styling (No Changes Required)

### Tailwind CSS 4 Configuration (`app/globals.css`)
- CSS-based Tailwind config with `@import "tailwindcss"`
- Custom source directives for scanning
- Radix color imports
- CSS custom properties for theming
- Custom gradient classes

### PostCSS Config (`postcss.config.mjs`)
- Uses `@tailwindcss/postcss` plugin

---

## Routes Configuration (`app/routes.tsx`)

Current route constants:
```typescript
export const ROUTES = {
  home: "/",
  privacyPolicy: "/privacy",
  quiz: "/quiz",
  quizResults: "/quiz/results",
  activities: "/tt/activities",
  play: "/tt/play",
  newActivity: "/tt/create",
  build: {
    activity: (id: string) => `/tt/activities/${id}`,
    quizResults: (responseId: string) => `/quiz/results?id=${responseId}`,
  },
};
```

**Migration Note:** TanStack Router has type-safe route generation. Consider using TanStack's built-in navigation utilities.

---

## Key Migration Steps

### 1. Project Setup
- Initialize TanStack Start project structure
- Install required packages
- Configure `app.config.ts`

### 2. Router Configuration (`app/router.tsx`)
- Initialize `ConvexReactClient`
- Create `ConvexQueryClient` and `QueryClient`
- Connect Convex to React Query

### 3. Root Route (`app/routes/__root.tsx`)
- Set up Clerk authentication with `beforeLoad`
- Configure providers (PostHog, Clerk, Convex, Theme)
- Handle auth token for SSR

### 4. Create Route Files
- Convert each `app/**/page.tsx` to `app/routes/**/*.tsx`
- Convert layouts to parent route components

### 5. Update Imports
- Change Clerk imports from `@clerk/nextjs` to `@clerk/tanstack-start`
- Update environment variable references (NEXT_PUBLIC_ → VITE_)

### 6. Server Configuration
- Configure PostHog proxy routes
- Set up any server-side middleware

### 7. Update Build Scripts
- Replace `next dev/build/start` with TanStack equivalents

---

## Code References

### Next.js-Specific Code to Replace

- `middleware.ts:1-16` - Clerk middleware (replace with route-level protection)
- `app/layout.tsx:2` - Next.js font imports (use different approach)
- `app/layout.tsx:20-28` - Next.js metadata (use different approach)
- `components/ConvexClientProvider.tsx:8-20` - Provider setup (rewrite for TanStack Query)
- `env.ts:6-14` - NEXT_PUBLIC_ variables (change to VITE_ prefix)
- `next.config.mjs:14-25` - Rewrites (configure in TanStack server)

### React/Convex Code (Mostly Unchanged)

- All Convex `useQuery`, `useMutation`, `useAction` calls work the same
- All React state management unchanged
- All form handling unchanged
- All UI component code unchanged

---

## Open Questions

1. **PostHog Proxy:** How to configure server-side proxying in TanStack Start for PostHog?
2. **Metadata/SEO:** How to handle page metadata (title, description, icons) in TanStack Start?
3. **PWA Manifest:** How to serve `/manifest.json` in TanStack Start?
4. **Font Loading:** Best approach for Google Fonts in TanStack Start (Geist Sans/Mono)?
5. **Protected Routes:** Best pattern for route protection with Clerk in TanStack Start?

---

## Risk Assessment

### Low Risk (Unchanged)
- Convex backend and all functions
- Radix UI components
- Tailwind CSS styling
- React Hook Form integration
- Google Maps integration
- PostHog client-side tracking

### Medium Risk (Configuration Changes)
- Environment variable naming (NEXT_PUBLIC_ → VITE_)
- Build and development scripts
- Provider setup order
- Route definitions

### Higher Risk (Requires Rewrite)
- Clerk authentication integration
- Convex + React Query integration
- Server-side middleware/proxying
- Metadata and SEO handling
