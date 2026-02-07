# Image Compression Before Upload - Implementation Plan

## Overview

Add image compression to both upload paths (user upload and scrape workflow) to reduce Convex storage usage. All images will be resized to **1200 x 630** (3:2 ratio) and converted to **WebP** format before being stored.

## Current State Analysis

### Two Upload Paths (both store raw, unprocessed images):

1. **User Upload** (`components/ImageUpload.tsx`):
   - User selects file → raw file POSTed to Convex storage via `generateUploadUrl`
   - No size limits, no compression, no format conversion
   - Upload happens at `ImageUpload.tsx:57-61`

2. **Scrape Workflow** (`convex/imageProcessing.ts`):
   - Downloads image from external URL → stores raw blob via `ctx.storage.store()`
   - No compression, images stored at whatever size the source provides
   - Download + store happens at `imageProcessing.ts:51-56`
   - File currently runs in Convex default runtime (no `"use node"` directive)

### Target Specification (from README.md):
- Large: **1200 x 630** pixels
- Small: **400 x 267** pixels (not needed - storing one size only)
- Ratio: **3:2**
- Format: **WebP** (best compression, ~30% smaller than JPEG)

## Desired End State

- Every image stored in Convex storage is a **WebP** file at **1200x630** max dimensions (maintaining 3:2 aspect ratio, fitting within bounds)
- User uploads are compressed **client-side** before upload (saves bandwidth too)
- Workflow images are compressed **server-side** after download, before storage
- No schema changes needed (still one `imageId` per activity)

### Verification:
- Upload an image from the create activity page → inspect stored file size in Convex dashboard (should be significantly smaller than source)
- Run a scrape workflow → check that stored images are compressed WebP files
- Visually confirm image quality is acceptable

## What We're NOT Doing

- Not storing multiple sizes (small/large) - just one size (1200x630)
- Not migrating existing images in storage
- Not adding image display to the UI (separate task)
- Not adding file size validation or rejection
- Not changing the database schema

## Implementation Approach

**Client-side (user uploads)**: Use the browser Canvas API to resize and convert to WebP. This is zero-dependency and also reduces upload bandwidth.

**Server-side (workflow)**: Use `sharp` via Convex's external packages support. This requires adding a `convex.json` config and `"use node"` directive to the image processing file. `sharp` is the fastest Node.js image processing library and handles batch processing well.

---

## Phase 1: Client-Side Compression Utility

### Overview
Create a utility function that uses the browser Canvas API to resize and convert images to WebP. Integrate it into the `ImageUpload` component.

### Changes Required:

#### 1. New utility: `lib/compressImage.ts`

**File**: `lib/compressImage.ts` (new file)
**Purpose**: Client-side image compression using Canvas API

```typescript
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;
const WEBP_QUALITY = 0.82;

/**
 * Compress an image file to WebP at 1200x630 (3:2 ratio)
 * Uses the browser Canvas API - no dependencies needed.
 *
 * The image is scaled to fit within the target dimensions
 * while maintaining aspect ratio, then centered on a
 * transparent canvas.
 */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  // Calculate dimensions to fit within 1200x630 while keeping aspect ratio
  const scale = Math.min(
    TARGET_WIDTH / bitmap.width,
    TARGET_HEIGHT / bitmap.height,
    1, // Don't upscale
  );

  const scaledWidth = Math.round(bitmap.width * scale);
  const scaledHeight = Math.round(bitmap.height * scale);

  // Use OffscreenCanvas for better performance (works in Web Workers too)
  const canvas = new OffscreenCanvas(scaledWidth, scaledHeight);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, scaledWidth, scaledHeight);
  bitmap.close();

  const blob = await canvas.convertToBlob({
    type: "image/webp",
    quality: WEBP_QUALITY,
  });

  return blob;
}
```

#### 2. Modify `components/ImageUpload.tsx`

**File**: `components/ImageUpload.tsx`
**Changes**: Compress the image before uploading to Convex storage

In `handleUpload()` (around line 48-71), compress the file before POSTing:

```typescript
// Before (line 57-61):
const result = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": selectedImage.type },
  body: selectedImage,
});

// After:
let body: Blob = selectedImage;
let contentType = selectedImage.type;
try {
  body = await compressImage(selectedImage);
  contentType = "image/webp";
} catch (err) {
  console.error("Image compression failed, uploading raw file:", err);
}

const result = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": contentType },
  body,
});
```

Add the import at the top:
```typescript
import { compressImage } from "@/lib/compressImage";
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `pnpm run build`
- [x] Linting passes: `pnpm run lint`
- [x] `lib/compressImage.ts` exists and exports `compressImage`

#### Manual Verification:
- [ ] Upload a large image (e.g., 4000x3000 JPEG, ~5MB) from the create activity page
- [ ] Confirm the stored file in Convex dashboard is WebP and significantly smaller
- [ ] Confirm the preview still looks correct in the upload component
- [ ] Upload a small image (e.g., 200x100) and confirm it doesn't get upscaled

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual testing before proceeding.

---

## Phase 2: Server-Side Compression for Scrape Workflow

### Overview
Add `sharp` as an external dependency and integrate image compression into the scrape workflow's image processing pipeline.

### Changes Required:

#### 1. Install `sharp`

```bash
pnpm add sharp
pnpm add -D @types/sharp
```

#### 2. Create `convex.json` configuration

**File**: `convex.json` (new file, project root)
**Purpose**: Configure sharp as an external package for Convex Node.js runtime

```json
{
  "node": {
    "externalPackages": ["sharp"]
  }
}
```

#### 3. Modify `convex/imageProcessing.ts`

**File**: `convex/imageProcessing.ts`
**Changes**:
- Add `"use node"` directive (required for sharp)
- Add a `compressImageBlob()` helper using sharp
- Call compression after downloading, before storing

```typescript
"use node";

import sharp from "sharp";
// ... existing imports ...

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;
const WEBP_QUALITY = 82;

/**
 * Compress an image blob to WebP at 1200x630 max dimensions
 */
async function compressImageBlob(blob: Blob): Promise<Blob> {
  const buffer = Buffer.from(await blob.arrayBuffer());

  const compressed = await sharp(buffer)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: "inside",      // Scale to fit within bounds
      withoutEnlargement: true, // Don't upscale small images
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return new Blob([compressed], { type: "image/webp" });
}
```

Then in the `processImages` handler, add compression between download and store:

```typescript
// Before (lines 51-56):
const imageBlob = await downloadImage(activity.imageURL);
const storageId = await ctx.storage.store(imageBlob);

// After:
const imageBlob = await downloadImage(activity.imageURL);
const compressed = await compressImageBlob(imageBlob);
console.log(
  `Compressed: ${imageBlob.size} bytes → ${compressed.size} bytes (${Math.round((1 - compressed.size / imageBlob.size) * 100)}% reduction)`
);
const storageId = await ctx.storage.store(compressed);
```

**Important**: Adding `"use node"` means this file now runs in the Node.js runtime. Since `processImages` and `processImagesAndStore` are both `internalAction`s, this is compatible. The existing `downloadImage` helper function using `fetch` will continue to work in Node.js.

### Success Criteria:

#### Automated Verification:
- [x] `convex.json` exists at project root with `externalPackages` config
- [x] `sharp` is in `package.json` dependencies
- [x] TypeScript compiles: `pnpm run build`
- [ ] Convex backend deploys successfully: `pnpm run dev:backend` starts without errors
- [x] Linting passes: `pnpm run lint`

#### Manual Verification:
- [ ] Trigger a scrape workflow from the Convex dashboard
- [ ] Check logs for compression ratio output (e.g., "Compressed: 500000 bytes → 45000 bytes")
- [ ] Verify stored images in Convex dashboard are WebP format
- [ ] Verify stored images are reasonable size (typically 20-80KB each for WebP at 1200x630)

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation that the scrape workflow processes images correctly.

---

## Testing Strategy

### Unit Tests:
- Not adding unit tests for this change - the compression is straightforward and best verified manually/visually

### Manual Testing Steps:

1. **User upload - large image**: Upload a 5MB+ JPEG → confirm WebP output, significant size reduction
2. **User upload - small image**: Upload a 200x100 PNG → confirm no upscaling, still converts to WebP
3. **User upload - already WebP**: Upload a WebP file → confirm it still gets resized if needed
4. **Scrape workflow**: Trigger a scrape → check logs for compression stats, verify stored files
5. **Quality check**: View compressed images at full size to ensure acceptable visual quality at 0.82 quality factor

## Performance Considerations

- **Client-side**: Canvas API compression is fast (<500ms for most images). Using `OffscreenCanvas` for best performance.
- **Server-side**: `sharp` is the fastest Node.js image library (C++ libvips underneath). Processing 100+ images in a batch should complete well within Convex's 10-minute action timeout.
- **WebP at quality 82**: Good balance of quality vs size. Typically produces files 60-90% smaller than source PNGs and 30-50% smaller than source JPEGs.

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| `sharp` doesn't work with pnpm in Convex | Can fall back to installing with npm just for the convex functions, or use `jimp` (pure JS, slower but no native deps) |
| OffscreenCanvas not supported in old browsers | `OffscreenCanvas` is supported in all modern browsers. If needed, can fall back to regular `<canvas>` element |
| Quality too low at 0.82 | Easy to adjust - bump to 0.85 or 0.90 if images look degraded |
| Large batch of images causes timeout | `sharp` is fast enough. 100 images at ~500ms each = ~50 seconds, well within limits |

## References

- Current upload component: `components/ImageUpload.tsx`
- Current image processing: `convex/imageProcessing.ts`
- Activity creation: `convex/activities.ts:38-42` (generateUploadUrl), `convex/activities.ts:109-153` (createActivity)
- Scrape workflow integration: `convex/scrapeWorkflow.ts:186-191`
- Target sizing: `README.md:40-42`
- Convex external packages docs: https://docs.convex.dev/functions/bundling
- sharp docs: https://sharp.pixelplumbing.com/
