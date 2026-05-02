Tiny Tripper is an app that recommend the BEST activity to do, with or fo ryour kids, at a given point in time

## Development Commands

```bash
# Start full-stack development (frontend + backend)
pnpm dev
# Start frontend only
pnpm dev:frontend
# Start Convex backend only
pnpm dev:backend
# Build for production
pnpm build
# Start production server
pnpm start
# Lint code
pnpm lint
```

## Architecture Overview

This is a full-stack application built with:

- **Frontend**: Next.js, using App Router
- **Backend**: Convex for database, server logic, and real-time features
- **Authentication**: Clerk with JWT integration
- **Styling**: Tailwind CSS 4 with Radix UI Themes
- **Environment**: T3 Env for type-safe environment variables

## Key File Structure

```
app/                    # Next.js App Router pages
├── globals.css        # Global styles with Tailwind
├── layout.tsx         # Root layout with providers
├── page.tsx           # Home page
└── server/            # Server-side pages

components/            # Reusable React components
├── ConvexClientProvider.tsx
└── PostHogProvider.tsx

convex/               # Convex backend
├── schema.ts         # Database schema definition
├── auth.config.ts    # Clerk authentication config
└── myFunctions.ts    # Server functions

env.ts                # Environment variable schema
middleware.ts         # Next.js middleware
posthog.ts            # PostHog configuration
```

## Convex Integration

If you are working with Convex, you should go read the Convex docs at [`docs/convex.md`](docs/convex.md).

## Development Patterns

- All Convex functions follow the new syntax with explicit args and returns validators
- Always check the typescript and eslint errors before trying to commit
- In React, `useEffect` are an anti-pattern and should rarely be used. Prefer actioning what you would do inline of the action/event with an event handler

## Telemetry

- `otel` (client, `lib/otel.ts`) — wraps `posthog-js`. Methods: `captureException(error, properties?)`, `captureEvent(eventName, properties?)`, `log(level, message, properties?)`.
- `otelServer` (Convex backend, `convex/otelServer.ts`) — same three methods, but the first arg of every method is the Convex `ctx`. Distinct id is resolved from `ctx.auth.getUserIdentity()`. Capture is performed by an internal action (`internal.otelServer.sendCapture`) that the wrapper schedules via `ctx.scheduler.runAfter(0, …)`, so it works from both mutations and actions (queries don't have a scheduler — use it from a downstream mutation/action instead).

`log` always writes to `console[level]`; only `level === "error"` is also sent to PostHog (as a `$exception`).

`otelServer` reads `POSTHOG_KEY` (and optional `POSTHOG_HOST`, defaults to `https://eu.i.posthog.com`) from `process.env`. Set them in Convex with `npx convex env set POSTHOG_KEY <key>`. If `POSTHOG_KEY` is unset, capture is a silent no-op.

## Play page

When working on the play page (`app/tt/play/`) or the recommendation query that powers it (`convex/activities.ts` → `getRecommendation`), read [`docs/play.md`](docs/play.md) first. That file is the product spec for the page's default behavior, filters, and location handling.
