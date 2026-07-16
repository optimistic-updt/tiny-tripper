# ADR 0003 — Migrate from Next.js to TanStack Start

- **Status**: Accepted
- **Date**: 2026-07-16

## Context

The app was built on Next.js 15 (App Router), but every page was a `"use
client"` component fed by Convex React hooks — none of Next's server-component
or data-fetching machinery was in use. What Next actually provided was: file
routing, a document shell, `middleware.ts` (Clerk + a signed-in redirect),
PostHog `/ingest` rewrites, and the build/dev toolchain. TanStack Start
provides the same surface on top of Vite with typed file-based routing, and is
the direction we want for router-level type safety and a lighter toolchain.
The migration was researched on branch `chore/move-to-tanstack`
(`thoughts/research/2026-02-04-nextjs-to-tanstack-migration-research.md`);
this ADR records the decisions made when executing it.

The vinxi-era TanStack Start that research referenced is gone: since v1
(late 2025), Start is a Vite plugin (`@tanstack/react-start/plugin/vite`) with
`nitro/vite` as the server engine, and `vite dev`/`vite build` as the only
commands. Several stale APIs had to be avoided: `@tanstack/start` (renamed
`@tanstack/react-start`), `routerWithQueryClient` from
`@tanstack/react-router-with-query` (superseded by
`setupRouterSsrQueryIntegration` from `@tanstack/react-router-ssr-query`), and
Clerk's `SignedIn`/`SignedOut` (replaced by `<Show when="signed-in">` in
`@clerk/tanstack-react-start`).

## Decision

1. **Routes live in `src/`, shared code stays at the repo root.** The TanStack
   plugin owns `src/` (`routes/`, `router.tsx`, `start.ts`,
   `routeTree.gen.ts`); `components/`, `lib/`, `convex/`, and `env.ts` keep
   their root locations and `@/*` alias. Page components were moved into their
   route files rather than kept as separate page modules — they are
   page-level components with a single call site.

2. **Convex + React Query wiring per the current Convex docs.** `getRouter()`
   builds `ConvexReactClient` + `ConvexQueryClient` + `QueryClient` and calls
   `setupRouterSsrQueryIntegration`. Pages still use `convex/react` hooks
   (`useQuery`/`useMutation`) exactly as before — behavior is unchanged
   (loading state on SSR, live on client) — but the React Query integration is
   in place so routes can adopt `useSuspenseQuery` + loader prefetch
   incrementally.

3. **Clerk: middleware via `createStart`, SSR token via server fn.**
   `src/start.ts` registers `clerkMiddleware()` as request middleware
   (replaces `middleware.ts`). The root route's `beforeLoad` fetches
   `{ userId, token }` with a `createServerFn` that mints the token from the
   **"convex" JWT template** (required by `convex/auth.config.ts` —
   plain `getToken()` would not validate) and hands it to
   `convexQueryClient.serverHttpClient` for SSR-time queries.
   The `middleware.ts` signed-in redirect (`/` → `/tt/play`) moved to
   `beforeLoad` on the index route, using `context.userId` from the root.

4. **PostHog proxy is duplicated on purpose.** Production traffic goes
   through a splat server route (`src/routes/ingest.$.ts`) that forwards to
   `eu.i.posthog.com` / `eu-assets.i.posthog.com` — host-agnostic, no
   platform rewrites needed. Dev traffic is handled by `server.proxy` in
   `vite.config.ts` because Vite's transform middleware swallows GET requests
   with `.js` extensions (e.g. `/ingest/static/array.js`) before they reach
   the server route. Nitro `routeRules` were rejected because they wouldn't
   cover dev, and the server route alone couldn't either.

5. **Env vars renamed `NEXT_PUBLIC_*` → `VITE_*`.** `env.ts` switched from
   `@t3-oss/env-nextjs` to `@t3-oss/env-core` with `clientPrefix: "VITE_"`
   and `runtimeEnv: import.meta.env`. The encrypted `.env.local` was migrated
   in place with `dotenvx set` (old keys removed). The `dotenvx run
   --convention=nextjs` wrapper stays — it only governs .env file load order,
   and decrypted `process.env` values take priority over the encrypted values
   Vite would read from the file directly.

6. **Geist fonts dropped, not ported.** The old layout loaded Geist via
   `next/font` and set CSS variables, but the `@theme` block consuming them
   has been commented out in `globals.css` since before the migration — Radix
   Themes' font stack is what actually renders. Porting the fonts would have
   added a Fontsource dependency to reproduce an unused variable.

7. **ESLint pinned to the pre-migration rule surface.**
   `eslint-config-next` was replaced with `typescript-eslint` +
   `eslint-plugin-react-hooks`, but only `rules-of-hooks`/`exhaustive-deps`
   are enabled — react-hooks v7's compiler-powered rules (e.g.
   `set-state-in-effect`) flag inherited patterns in the play page and can be
   adopted as a separate cleanup.

8. **CJS interop for `@googlemaps/js-api-loader`** via `ssr.noExternal` — the
   package is CommonJS and its named `Loader` export breaks under Vite's SSR
   module runner when externalized.

## Consequences

- `pnpm dev` / `pnpm build` / `pnpm start` behave as before; production runs
  `node .output/server/index.mjs` (Nitro output) instead of `next start`.
- `src/routeTree.gen.ts` is generated on every dev/build run and is committed
  so `tsc --noEmit` works on a fresh clone.
- `Link`/`navigate` calls are now type-checked against the route tree. The
  `/privacy` links intentionally remain plain `<a>` tags because no privacy
  route exists yet — creating it will surface the type error to fix them.
- `/quiz/results?id=…` is now a validated search param
  (`validateSearch` on the results route) instead of a hand-built query
  string; `ROUTES.build.*` was removed from `lib/routes.ts` (was
  `app/routes.tsx`).
- Deployment must target a Node server (or another Nitro preset) rather than
  a Next.js host; the PostHog rewrites no longer depend on the platform.
