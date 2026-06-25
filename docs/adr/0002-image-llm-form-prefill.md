# ADR 0002 — Image → LLM form prefill on Create Activity

- **Status**: Accepted
- **Date**: 2026-06-25

## Context

Creating an activity from a flyer/poster means re-typing what's already printed
on the image. We want to extract the obvious fields (title, blurb, a few tags,
the rain/at-home flags) with an LLM and pre-fill the create form, without slowing
the page down or ever overwriting what the user has typed. The full design lives
in [`docs/image-llm-prefill-prd.md`](../image-llm-prefill-prd.md); this ADR
records the architecturally-significant choices and the ones refined at build
time.

Constraints audited up-front:

- `/tt/create` is **not** behind `middleware.ts` auth — a naive extraction
  endpoint is an open, billable OpenAI proxy.
- The form (`app/tt/create/page.tsx`) is React Hook Form but sets every
  non-text field via bare `setValue(...)` with **no dirty tracking**; `name`/
  `description`/`endDate`/`sourceUrl` use `register` (auto-dirty on type).
- `location` is a structured Google Places object with a `placeId` the LLM
  can't produce; `rainApproved`/`inHome` are booleans the form maps to the
  special `"rain approved"`/`"at home"` tags on submit.
- OpenAI is the only LLM wired (`openai@6.18.0`, `text-embedding-3-small`
  embeddings in `convex/activities.ts`, default Convex runtime — no `"use node"`).

## Decision

1. **Parallelized, inline extraction.** On "Confirm & Upload", compress once,
   then run the existing storage upload **and** a new `extractActivityFromImage`
   action concurrently. The action takes image bytes inline as a base64 data URL
   (`{ imageBase64 }`), so it never waits on `storageId`. Net added latency ≈ one
   LLM round-trip, overlapped with the upload.

2. **Auth-gated action.** `extractActivityFromImage` throws if
   `ctx.auth.getUserIdentity()` is null. Auto-fill is a signed-in bonus; signed-
   out users still upload + fill manually. Cheap abuse protection on a public
   route, without per-IP rate limiting (deferred).

3. **`gpt-5-mini` via the Responses API + Structured Outputs.** `responses.parse`
   with `zodTextFormat(schema, …)` (from `openai/helpers/zod`, zod v4); read
   `output_parsed`. Low reasoning effort, 20s request timeout. The model is a
   single swappable constant (`EXTRACTION_MODEL`) — if it's unavailable the
   action throws and the feature degrades silently.

4. **Extract five nullable fields:** `name`, `description`, `tags` (free-form,
   lowercase, one-per-category, excludes the rain/at-home tags), `rainApproved`,
   `inHome`. The model omits anything it can't confidently read.

5. **Merge via `reset(..., { keepDirtyValues: true })` + a `shouldDirty`
   retrofit.** `handleExtracted` calls
   `reset({ ...getValues(), ...definedExtracted }, { keepDirtyValues: true })`.
   Because the form previously didn't mark `setValue` edits dirty, we added
   `{ shouldDirty: true }` to **every** manual `setValue` handler so user-touched
   fields are recognised as dirty and preserved. Spreading `getValues()` keeps
   untouched non-extracted fields (notably the just-uploaded `imageId`) from
   being wiped. A `hasSubmittedRef` guard drops results that arrive after submit.

6. **Fail safe.** The action throws on any OpenAI error (server-side
   `otelServer` capture); the client catches silently (`otel`), runs a 25s
   timeout race, and never blocks upload or submit. Empty result → no-op.
   Auto-filled fields get a brief highlight.

## Alternatives considered

- **Conditional per-field `setValue`** (read `getValues()`, fill each field only
  when empty) instead of `reset` + `keepDirtyValues`. Equivalent end behaviour
  and a smaller diff, but the owner chose to keep the PRD's `reset` mechanism;
  the `shouldDirty` retrofit makes it correct. Trade-off accepted: toggling a
  boolean on→off returns it to the default value, which RHF re-marks clean, so
  extraction could re-fill it (rare).
- **Pass `storageId` and have the action fetch the stored image.** Rejected —
  serializes extraction behind the upload and adds a storage round-trip. Inline
  base64 (~hundreds of KB + 33%, well under Convex's ~1MB single-string arg
  limit) is smaller and parallelizable. A `MAX_EXTRACTION_DATA_URL_LENGTH` guard
  skips oversized payloads.
- **Chat Completions `parse`** instead of the Responses API. Either works in
  `openai@6`; Responses + `zodTextFormat` is the current-generation path and
  what the SDK steers toward.
- **Return all-nulls on OpenAI error** instead of throwing. Rejected — conflates
  "extraction failed" with "nothing extractable" and weakens telemetry. The
  client already treats failures as a silent no-op, so throwing is safe.
- **Extract `location`/`endDate`/`urgency`.** Out of scope (v1) — `location`
  needs a `placeId` the model can't produce; the rest are low-value for flyers.

## Consequences

**Positive**

- Perceived latency is just the upload; extraction overlaps and surfaces its own
  "Analyzing…" indicator.
- No new dependency or runtime: reuses `openai`, `zod`, the existing
  `OPENAI_API_KEY`, and the default Convex runtime.
- Auth gate removes the obvious credit-burn vector without blocking the public
  upload flow.

**Negative / accepted trade-offs**

- `gpt-5-mini` + Responses structured-output availability is unverified in this
  ADR — must be confirmed against the live OpenAI account before shipping;
  mitigated by the swappable constant + silent-degrade path.
- The `shouldDirty` retrofit touches every manual `setValue` in the create form.
- The 25s client timeout doesn't cancel the in-flight Convex action; the 20s
  server-side OpenAI timeout caps it just below.
- Free-form tags can drift over time; the one-tag-per-category prompt rule
  reduces but doesn't eliminate this. Constrained vocabulary deferred.

## Implementation references

- Action: [`convex/imageExtraction.ts`](../../convex/imageExtraction.ts) —
  `extractActivityFromImage`.
- Trigger + orchestration: [`components/ImageUpload.tsx`](../../components/ImageUpload.tsx)
  — `handleUpload` (compress once, parallel upload + `runExtraction`).
- Merge: [`app/tt/create/page.tsx`](../../app/tt/create/page.tsx) —
  `handleExtracted`, the `shouldDirty` retrofit, `hasSubmittedRef` guard.
- Product spec: [`docs/image-llm-prefill-prd.md`](../image-llm-prefill-prd.md).
