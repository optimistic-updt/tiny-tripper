# TanStack Start — how this app is wired

The frontend is [TanStack Start](https://tanstack.com/start) v1: a Vite plugin
(`@tanstack/react-start/plugin/vite`) plus `nitro/vite` for the server build.
There is no `next.config.mjs`, no `middleware.ts`, and no vinxi — `vite dev`
and `vite build` are the whole toolchain. See
[ADR 0003](adr/0003-migrate-nextjs-to-tanstack-start.md) for why each choice
was made.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | frontend (`vite dev`, port 3000) + `convex dev` in parallel |
| `pnpm build` | `vite build` → `.output/` (client assets + Nitro server) |
| `pnpm start` | `node .output/server/index.mjs` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `eslint .` |

Everything runs under `dotenvx run --convention=nextjs` because `.env.local`
is dotenvx-encrypted; the flag only controls which .env files load.

## Routing

Routes are files in `src/routes/`, registered in the generated
`src/routeTree.gen.ts` (committed, never hand-edited — the plugin rewrites it
on every dev/build).

- `__root.tsx` — the document shell (`<html>`/`<head>`/`<body>`), head
  metadata (`head()` → title, description, icon, manifest, stylesheets), the
  provider stack, and Clerk SSR auth (see below).
- `route.tsx` inside a folder = layout for that segment (renders `<Outlet/>`):
  `quiz/route.tsx`, `tt/route.tsx`.
- `index.tsx` = the segment's index page; `results.tsx`, `play.tsx`, etc. are
  leaf pages. Each exports `Route = createFileRoute("/path")({ component })`.
- `ingest.$.ts` — a splat *server route* (`server.handlers`) with no UI; it
  reverse-proxies PostHog.

Navigation is type-checked: `<Link to>` / `useNavigate()` from
`@tanstack/react-router`, with path constants in `lib/routes.ts` (`as const`
so they satisfy the route-path union). Search params are declared with
`validateSearch` (e.g. `id` on `/quiz/results`) and read via
`Route.useSearch()`.

## Providers & auth

`src/router.tsx` exports `getRouter()`: creates `ConvexReactClient`,
`ConvexQueryClient`, and a React Query `QueryClient`, wires them together, and
calls `setupRouterSsrQueryIntegration`. The three clients ride in router
context (`createRootRouteWithContext`).

In `__root.tsx`:

```
ClerkProvider
└─ ConvexProviderWithClerk        (client from router context)
   └─ RootDocument (html/body)
      └─ PostHogProvider          (posthog-js init, api_host "/ingest")
         └─ Radix <Theme>
            └─ <Outlet/>
```

- `src/start.ts` registers `clerkMiddleware()` for every request
  (`createStart` — this replaced Next's `middleware.ts`).
- Root `beforeLoad` runs a server fn that calls Clerk's `auth()` and mints a
  token from the **"convex" JWT template** — this exact template is what
  `convex/auth.config.ts` validates. The token feeds
  `convexQueryClient.serverHttpClient.setAuth()` during SSR, and
  `{ userId, token }` lands in router context for descendants (the index route
  uses `context.userId` to redirect signed-in users to `/tt/play`).
- Clerk UI: import from `@clerk/tanstack-react-start`. Note `SignedIn`/
  `SignedOut` don't exist in this SDK — use `<Show when="signed-in">` /
  `<Show when="signed-out">`.

## Environment variables

Client-exposed vars use the `VITE_` prefix and are validated in `env.ts`
(`@t3-oss/env-core`, `runtimeEnv: import.meta.env`). Server-only secrets
(`CLERK_SECRET_KEY`, …) stay unprefixed and are read from `process.env`.
To add one: `pnpm exec dotenvx set VITE_FOO <value> -f .env.local`, then add
it to the schema in `env.ts` and to `.env.example`.

## PostHog proxy (`/ingest`)

posthog-js points at `/ingest` so analytics survive ad blockers. Two layers
serve it (both are needed — see ADR 0003 §4):

- **Dev**: `server.proxy` in `vite.config.ts` (Vite's transform middleware
  would otherwise intercept `/ingest/static/*.js` asset requests).
- **Prod**: `src/routes/ingest.$.ts` forwards to `eu.i.posthog.com`
  (`static/*` → `eu-assets.i.posthog.com`), so no platform rewrite rules are
  required wherever the Nitro server runs.

## Styling

`src/styles/app.css` is the Tailwind 4 entry (`@tailwindcss/vite` plugin, no
PostCSS config). It uses `source(none)` + explicit `@source` globs — add new
directories there if you create them, or their classes won't be generated.
Radix Themes CSS is linked in `__root.tsx` alongside `app.css` (both via
`?url` imports in the `head()` links).

## Gotchas

- Don't enable `verbatimModuleSyntax` in tsconfig (server code can leak into
  client bundles, per TanStack docs).
- CJS-only deps that break SSR with named imports go in `ssr.noExternal`
  (currently `@googlemaps/js-api-loader`).
- `convex dev` detects Vite and manages `VITE_CONVEX_URL` in `.env.local`.
