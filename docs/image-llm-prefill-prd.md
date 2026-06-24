# PRD — Image → LLM Form Prefill (Create Activity)

**Status:** Approved for implementation
**Owner:** kev4tech@gmail.com
**Last updated:** 2026-06-24
**Branch:** `claude/image-llm-form-prefill-i6w71t`

## Summary

On the Create Activity page (`app/tt/create/page.tsx`), when a user uploads an
image (e.g. an event flyer or poster), send that image to an LLM and use the
returned structured output to pre-fill empty fields of the create form. The goal
is to save the user typing while never overwriting anything they've already
entered, and to keep the interaction as fast as possible.

## Goals

- Reduce manual data entry when creating an activity from a flyer/poster/photo.
- Pre-fill **only** fields the user hasn't touched.
- Keep perceived latency minimal by overlapping the LLM call with the existing
  image upload.
- Fail safe: extraction problems never block image upload or form submission.

## Non-goals (v1)

- Extracting `location` (form uses a structured Google Places object with a
  `placeId` the LLM cannot produce), `endDate`, `urgency`, `sourceUrl`,
  `isPublic`.
- Constrained/curated tag vocabulary (free-form for now).
- Rate limiting / IP throttling beyond requiring authentication.
- Re-running extraction on the auto-upload-at-submit path.

## Current behavior (context)

- **Form** (`app/tt/create/page.tsx`): React Hook Form, fields `name`,
  `description`, `urgency`, `location`, `endDate`, `isPublic`, `rainApproved`,
  `inHome`, `tags[]`, `imageId`, `sourceUrl`. `rainApproved`/`inHome` are booleans
  the form maps to the special tags `"rain approved"` / `"at home"` on submit.
- **Image upload** (`components/ImageUpload.tsx`): user selects a file →
  preview shown (pending) → optional **"Confirm & Upload"** button
  (`handleUpload`) compresses to WebP (`lib/compressImage.ts`) and uploads to
  Convex storage via `api.activities.generateUploadUrl`, returning a `storageId`.
  If skipped, the image auto-uploads on form submit.
- **AI today**: OpenAI only (`text-embedding-3-small` for embeddings in
  `convex/activities.ts`). `openai` v6 SDK + `OPENAI_API_KEY` already wired.
- **Tags**: stored in a `tags` table, queried via `api.tags.listTags`; the
  `TagCombobox` is hybrid (suggest existing + free-form create). Tags are
  normalized (trim + lowercase + dedupe) on write in `createActivityDocument`.

## Design decisions

### 1. Model & API
- Use **`gpt-5-mini`** (OpenAI) with **vision input + Structured Outputs**, via
  the existing `openai` v6 client and `OPENAI_API_KEY`.
- Use **low reasoning effort** for speed.
- Prefer the SDK structured-output helper (`responses.parse`); fall back to
  JSON-schema mode if the installed SDK version requires it. Confirm at build.

### 2. Trigger & parallelized flow
- Extraction fires when the user presses **"Confirm & Upload"** in
  `ImageUpload` (deliberate action → no surprise token spend).
- Compress the image **once**, then run two calls **in parallel**:
  1. **Storage upload** → `generateUploadUrl` → `fetch` → `storageId`
     (existing path; populates `imageId`).
  2. **Extraction** → new Convex action
     `extractActivityFromImage({ imageBase64 })` → OpenAI → structured output.
- The LLM call does **not** depend on `storageId` (image bytes are passed inline
  as a base64 data URL), so it never waits on the upload. Compressed WebP is
  small (~hundreds of KB + ~33% base64), comfortably within Convex action arg
  limits.
- Net added latency ≈ one LLM round-trip, overlapped with the upload.

### 3. Auth
- `extractActivityFromImage` calls `ctx.auth.getUserIdentity()` and throws if
  the user is not signed in. Auto-fill is a signed-in-only bonus; signed-out
  users can still upload images and fill the form manually. This removes the
  obvious credit-burn vector on a public route (`/tt/create` is not behind
  `middleware.ts` auth).

### 4. Extracted fields
All fields nullable; the model omits anything it cannot read from the image.

| Field          | Type      | Notes |
| -------------- | --------- | ----- |
| `name`         | string?   | Event/activity title. |
| `description`  | string?   | Short summary from the image. |
| `tags`         | string[]? | Free-form. **Excludes** `"rain approved"`/`"at home"` (those come from the booleans). |
| `rainApproved` | boolean?  | Inferred (weather-independent / works in rain). |
| `inHome`       | boolean?  | Inferred (doable at home / indoor). |

**Tag rule (in the prompt + schema description):** one tag per category, no
synonyms — e.g. `kids` **or** `family-friendly` (not both), plus a tag from a
different dimension such as `food`, `outdoor`, etc. Cap to a small set.

### 5. Merge into the form
- Apply extracted values with **`reset(extracted, { keepDirtyValues: true })`**.
  This fills only fields the user hasn't touched (works uniformly for text,
  tags, and the booleans — `dirtyFields` semantics).
- If extraction returns **after** the form is already submitted, drop the result
  (no-op).

### 6. UX
- **Loading:** inline "✨ Analyzing image…" indicator, independent of the
  image's own upload state. The "Confirm & Upload" button completes as soon as
  `storageId` returns; extraction shows its own indicator.
- **Failure** (OpenAI error/timeout): silent + `otel.captureException`; never
  blocks upload or submit. Optional tiny dismissible "Couldn't auto-fill from
  image" note.
- **Empty result:** no-op (no error shown).
- **Success:** briefly highlight the fields that were auto-filled so the user
  notices what changed.
- **Timeout:** ~25s; on timeout, drop the "Analyzing…" state silently.

## Architecture / files to touch

- **`convex/activities.ts`** (or a new `convex/imageExtraction.ts`): add
  `extractActivityFromImage` action — `"use node"`, auth check, OpenAI vision
  call with structured-output schema, returns the typed object.
- **`components/ImageUpload.tsx`**: compress once; fire upload + extraction in
  parallel inside `handleUpload`; add `onExtracted(data)` prop to bubble results
  up; add the "Analyzing…" indicator and silent error handling.
- **`app/tt/create/page.tsx`**: pass `onExtracted` to `ImageUpload`; on result,
  call `reset(extracted, { keepDirtyValues: true })`; add the auto-filled-field
  highlight cue.

## Open implementation details (decided by implementer)

- Orchestration lives **inside `ImageUpload`** (it owns the compressed blob +
  upload); the page does the `reset()`.
- Exact structured-output mechanism (`responses.parse` vs JSON-schema mode)
  confirmed against the installed `openai` SDK at build time.

## Risks

- **Cost/abuse:** mitigated for v1 by requiring auth; revisit rate limiting if
  abuse appears.
- **Model/SDK drift:** `gpt-5-mini` and Responses-API structured outputs must be
  available in the installed SDK; verify and fall back gracefully.
- **Tag fragmentation:** free-form tags can drift over time; the one-tag-per-
  category prompt rule reduces but doesn't eliminate this. A constrained
  vocabulary is a future enhancement.

## Future enhancements

- Constrained-but-extensible tag vocabulary seeded from `listTags`.
- Extract `endDate`/`location` (address string hint, not the structured field).
- Per-user rate limiting on the extraction action.
- Fire extraction on image **select** (not just upload) for earlier prefill.
