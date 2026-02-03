---
date: 2026-02-03T08:30:00-08:00
researcher: Claude
git_commit: 15d7f64518eeb3aca3525806329abed9884088bf
branch: main
repository: optimistic-updt/tiny-tripper
topic: "Tailwind CSS v4.1.18 uncaughtException causing slow dev server"
tags: [research, tailwind, next.js, bug]
status: complete
last_updated: 2026-02-03
last_updated_by: Claude
---

# Research: Tailwind CSS v4.1.18 uncaughtException causing slow dev server

**Date**: 2026-02-03T08:30:00-08:00
**Researcher**: Claude
**Git Commit**: 15d7f64518eeb3aca3525806329abed9884088bf
**Branch**: main
**Repository**: optimistic-updt/tiny-tripper

## Research Question

When starting the development server, the following error occurs and navigation is extremely slow or broken:

```text
[TypeError: Cannot read properties of undefined (reading 'length')]
⨯ uncaughtException: [TypeError: Cannot read properties of undefined (reading 'length')]
```

## Summary

**Root Cause**: Tailwind CSS v4.1.18 is scanning hidden directories in the project (`.cursor`, `.claude`, `.agents`, `.codex`, `.github`) that contain files which cause errors during processing. This is a known bug in Tailwind v4.1.x where the automatic source detection scans directories that should be ignored.

**The Fix**: Add explicit source directives to `app/globals.css` to prevent Tailwind from scanning problematic directories:

```css
@import "tailwindcss" source(none);
@source "../app/**/*.{js,ts,jsx,tsx,mdx}";
@source "../components/**/*.{js,ts,jsx,tsx,mdx}";
@source "../convex/**/*.{js,ts,jsx,tsx}";
```

Or alternatively, exclude the specific directories:

```css
@import "tailwindcss";
@source not "../.cursor";
@source not "../.claude";
@source not "../.agents";
@source not "../.codex";
@source not "../.github";
```

## Detailed Findings

### Environment Analysis

**Package versions from `package.json`:**

- Next.js: 15.2.8
- Tailwind CSS: 4.1.18
- @tailwindcss/postcss: 4.1.18
- React: 19.2.4

**Hidden directories in project root:**

- `.cursor/` - Contains Cursor IDE rules (28KB `.mdc` file)
- `.claude/` - Claude configuration
- `.agents/` - Agent-related files
- `.codex/` - Codex files
- `.github/` - GitHub configuration
- `.husky/` - Git hooks
- `.clerk/` - Clerk configuration

### The Bug

Tailwind CSS v4.1.18 has a known issue where it scans the entire project directory to detect class usage. When it encounters certain files in hidden directories (especially AI tool directories like `.cursor`, `.claude`, `.agents`), it can:

1. Process files with unusual character sequences
2. Generate invalid Unicode code points (reported as `RangeError: Invalid code point` in similar issues)
3. Throw TypeError exceptions when processing undefined values

The error manifests as:

- `[TypeError: Cannot read properties of undefined (reading 'length')]`
- Extremely slow compilation (12+ seconds for a single route)
- Server crashes or hangs

### Related GitHub Issues

1. **[Discussion #19556](https://github.com/tailwindlabs/tailwindcss/discussions/19556)**: Tailwind 4.1.18 build issues with directories like `.cursor/plans/`, `.agent/`, `.claude/`
2. **[Issue #15943](https://github.com/tailwindlabs/tailwindcss/issues/15943)**: Path exclusion feature removed in v4
3. **[Discussion #18311](https://github.com/tailwindlabs/tailwindcss/discussions/18311)**: Invalid code point errors during v3 to v4 upgrades

### Current Configuration

**`app/globals.css:1`:**

```css
@import "tailwindcss";
```

This uses automatic source detection, which scans all directories including the problematic hidden ones.

**`postcss.config.mjs`:**

```javascript
const config = {
  plugins: ["@tailwindcss/postcss"],
};
export default config;
```

### Affected Files

- `app/globals.css:1` - The `@import "tailwindcss"` directive triggers the scanning
- `.cursor/rules/convex_rules.mdc` - 28KB file being scanned unnecessarily

### Next.js 15.2.x Performance Notes

Additionally, Next.js 15.2.x has known performance regressions in development mode:

- [Issue #76937](https://github.com/vercel/next.js/issues/76937): React's "Owner Stacks" feature causes noticeable lag
- The workaround is to downgrade to 15.1.7 or wait for React updates

However, the primary issue here is the Tailwind scanning bug.

## Code References

- `app/globals.css:1` - Current Tailwind import without source restrictions
- `postcss.config.mjs:2` - PostCSS plugin configuration
- `package.json:33` - Next.js version 15.2.8
- `package.json:55` - Tailwind CSS version 4.1.18

## Architecture Documentation

The project uses:

- Tailwind CSS v4 with the new `@import "tailwindcss"` syntax
- PostCSS via `@tailwindcss/postcss` plugin
- Next.js App Router with client components

## Solutions

### Solution 1: Explicit Source Paths (Recommended)

Modify `app/globals.css`:

```css
@import "tailwindcss" source(none);
@source "../app/**/*.{js,ts,jsx,tsx,mdx}";
@source "../components/**/*.{js,ts,jsx,tsx,mdx}";
@source "../convex/**/*.{js,ts,jsx,tsx}";
```

### Solution 2: Exclude Directories

Modify `app/globals.css`:

```css
@import "tailwindcss";
@source not "../.cursor";
@source not "../.claude";
@source not "../.agents";
@source not "../.codex";
@source not "../.github";
```

### Solution 3: Downgrade Tailwind

Downgrade to Tailwind v4.0.7:

```bash
pnpm install tailwindcss@4.0.7 @tailwindcss/postcss@4.0.7
```

## Sources

- [GitHub Discussion #19556 - Tailwind 4.1.18 build issues](https://github.com/tailwindlabs/tailwindcss/discussions/19556)
- [GitHub Issue #15943 - Path exclusion no longer supported](https://github.com/tailwindlabs/tailwindcss/issues/15943)
- [GitHub Discussion #18311 - Invalid code point errors](https://github.com/tailwindlabs/tailwindcss/discussions/18311)
- [GitHub Issue #76937 - Next.js 15.2 performance regression](https://github.com/vercel/next.js/issues/76937)
- [Tailwind CSS Source Detection Documentation](https://tailwindcss.com/docs/detecting-classes-in-source-files)

## Open Questions

1. Should the hidden directories be added to `.gitignore` to prevent future scanning issues?
2. Would upgrading to a newer Tailwind version (if available) resolve this automatically?
