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

- **Frontend**: Next.js 15 with React 19, using App Router
- **Backend**: Convex for database, server logic, and real-time features
- **Authentication**: Clerk with JWT integration
- **Styling**: Tailwind CSS 4 with Radix UI Themes
- **Analytics**: PostHog for tracking
- **Environment**: T3 Env for type-safe environment variables
- **Forms**: React Hook Form with Zod validation

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

## Play page

When working on the play page (`app/tt/play/`) or the recommendation query that powers it (`convex/activities.ts` → `getRecommendation`), read [`docs/play.md`](docs/play.md) first. That file is the product spec for the page's default behavior, filters, and location handling.
