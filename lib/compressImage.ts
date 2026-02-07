const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;
const WEBP_QUALITY = 0.82;

/**
 * Compress an image file to WebP at 1200x630 (3:2 ratio)
 * Uses the browser Canvas API - no dependencies needed.
 *
 * The image is scaled to fit within the target dimensions
 * while maintaining aspect ratio, then drawn onto a canvas
 * matching the scaled size.
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
