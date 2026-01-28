# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start full-stack development (frontend + backend)
npm run dev

# Start frontend only
npm run dev:frontend

# Start Convex backend only
npm run dev:backend

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
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

- Database schema defined in `convex/schema.ts`
- Authentication configured for Clerk integration via `convex/auth.config.ts`
- Real-time features available through Convex subscriptions

### Function Syntax

Always use the new function syntax with explicit args and returns validators:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myFunction = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return "Hello " + args.name;
  },
});
```

### Key Conventions

- **Public functions**: Use `query`, `mutation`, `action` for public API
- **Internal functions**: Use `internalQuery`, `internalMutation`, `internalAction` for private functions
- **Always include validators**: Every function needs `args` and `returns` validators
- **Null returns**: Use `returns: v.null()` when a function doesn't return anything
- **Function references**: Use `api.file.function` for public, `internal.file.function` for internal

### Query Guidelines

- Do NOT use `filter` in queries - use `withIndex` instead
- Define indexes in schema for all query patterns
- Use `.order('asc')` or `.order('desc')` for ordering
- Use `.unique()` to get a single document (throws if multiple match)

### Schema Guidelines

- System fields `_id` and `_creationTime` are automatically added
- Index names should include all fields: `by_field1_and_field2`
- Index fields must be queried in the order they are defined

### Actions

- Add `"use node";` at top of files using Node.js modules
- Actions cannot use `ctx.db` - use `ctx.runQuery`/`ctx.runMutation` instead
- Minimize calls from actions to queries/mutations (each is a separate transaction)

### File Storage

- Use `ctx.storage.getUrl()` to get signed URLs for files
- Query `_storage` system table for file metadata: `ctx.db.system.get(fileId)`

### Full Reference

See `.cursor/rules/convex_rules.mdc` for comprehensive examples including HTTP endpoints, pagination, crons, and more

## Environment Variables

Environment variables are type-safe using T3 Env. See `env.ts` for the complete schema including:
- Convex deployment and URL
- Clerk authentication keys
- OAuth provider credentials (Google, GitHub, Discord)
- PostHog analytics configuration

## Development Patterns

- Components are wrapped with ConvexClientProvider for database access
- Clerk handles authentication with dynamic loading
- PostHog provider enables analytics tracking
- Radix UI Themes provides consistent design system
- All Convex functions follow the new syntax with explicit args and returns validators
- Always check the typescript and eslint errors before trying to commit