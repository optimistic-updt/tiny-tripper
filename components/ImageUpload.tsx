"use client";

import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Flex, Text, Box, Callout, Spinner } from "@radix-ui/themes";
import { Camera, Upload, X, AlertCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { compressImage } from "@/lib/compressImage";
import { otel } from "@/lib/otel";

/** Fields the LLM extracts from the image to pre-fill the create form. */
export type ExtractedActivity = {
  name: string | null;
  description: string | null;
  tags: string[] | null;
  rainApproved: boolean | null;
  inHome: boolean | null;
};

interface ImageUploadProps {
  value?: Id<"_storage">;
  onChange: (storageId: Id<"_storage"> | undefined) => void;
  onPendingImageChange?: (hasPendingImage: boolean) => void;
  onExtracted?: (data: ExtractedActivity) => void;
}

export interface ImageUploadHandle {
  uploadPendingImage: () => Promise<void>;
}

/** Read a Blob (compressed webp or raw File fallback) as a base64 data URL. */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Drop the "Analyzing…" state if extraction hasn't returned by this point.
const EXTRACTION_TIMEOUT_MS = 25_000;
// Defensive guard vs Convex's ~1MB single-string argument limit.
const MAX_EXTRACTION_DATA_URL_LENGTH = 900_000;

const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(
  ({ value, onChange, onPendingImageChange, onExtracted }, ref) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.activities.generateUploadUrl);
    const extractActivity = useAction(
      api.imageExtraction.extractActivityFromImage,
    );

    const handleFileSelect = (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };

      reader.readAsDataURL(file);
      onPendingImageChange?.(true);
    };

    // Fire the LLM extraction in parallel with the storage upload. Owns its own
    // state and must NEVER block or fail the upload/submit. Silent on error.
    const runExtraction = async (body: Blob) => {
      try {
        const dataUrl = await blobToDataUrl(body);
        if (dataUrl.length > MAX_EXTRACTION_DATA_URL_LENGTH) {
          otel.log("warn", "Skipping image extraction: image too large", {
            length: dataUrl.length,
          });
          return;
        }

        const timeout = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), EXTRACTION_TIMEOUT_MS),
        );
        const extracted = await Promise.race([
          extractActivity({ imageBase64: dataUrl }),
          timeout,
        ]);

        if (extracted) {
          onExtracted?.(extracted);
        }
      } catch (error) {
        otel.captureException(error, { context: "image_extraction" });
      } finally {
        setIsAnalyzing(false);
      }
    };

    const handleUpload = async () => {
      if (!selectedImage) return;

      setIsUploading(true);

      // Compress once; the same Blob feeds both the upload and the extraction.
      let body: Blob = selectedImage;
      let contentType = selectedImage.type;
      try {
        body = await compressImage(selectedImage);
        contentType = "image/webp";
      } catch (err) {
        console.error("Image compression failed, uploading raw file:", err);
        otel.captureException(err, { context: "image_compression" });
      }

      // Kick off extraction concurrently. Auth is enforced server-side, so this
      // is a no-op for signed-out users (the action throws and we swallow it).
      if (onExtracted) {
        setIsAnalyzing(true);
        void runExtraction(body);
      }

      // Upload owns isUploading and clears it as soon as the storageId returns.
      try {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": contentType },
          body,
        });

        const { storageId } = await result.json();
        onChange(storageId);
        onPendingImageChange?.(false);
      } catch (error) {
        console.error("Upload failed:", error);
        otel.captureException(error, { context: "image_upload" });
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    };

    const handleRemove = () => {
      setSelectedImage(null);
      setPreviewUrl(null);
      onChange(undefined);
      onPendingImageChange?.(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    };

    // Expose uploadPendingImage method to parent
    useImperativeHandle(ref, () => ({
      uploadPendingImage: async () => {
        if (selectedImage && !value) {
          await handleUpload();
        }
      },
    }));

    return (
      <Flex direction="column" gap="3">
        {previewUrl ? (
          <Box>
            <Box
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "400px",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />

              <Button
                type="button"
                variant="soft"
                color="red"
                size="1"
                onClick={handleRemove}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                }}
              >
                <span className="sr-only">remove image</span>
                <X size={16} />
              </Button>
            </Box>

            {!value && (
              <>
                <Callout.Root color="orange" mt="3">
                  <Callout.Icon>
                    <AlertCircle size={16} />
                  </Callout.Icon>
                  <Callout.Text>
                    Click &ldquo;Confirm & Upload&rdquo; to save this image, or
                    it will be uploaded automatically when you submit the form.
                  </Callout.Text>
                </Callout.Root>
                <Flex gap="2" mt="3">
                  <Button
                    type="button"
                    onClick={handleUpload}
                    loading={isUploading}
                    disabled={isUploading}
                  >
                    Confirm & Upload
                  </Button>
                  <Button type="button" variant="soft" onClick={handleRemove}>
                    Change Image
                  </Button>
                </Flex>
              </>
            )}

            {value && (
              <Text size="2" color="green" mt="2">
                ✓ Image uploaded successfully
              </Text>
            )}

            {isAnalyzing && (
              <Flex align="center" gap="2" mt="2">
                <Spinner size="1" />
                <Text size="2" color="gray">
                  ✨ Analyzing image to pre-fill fields…
                </Text>
              </Flex>
            )}
          </Box>
        ) : (
          <Flex gap="2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              style={{ display: "none" }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              style={{ display: "none" }}
            />

            <Button
              type="button"
              variant="soft"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              Choose File
            </Button>

            <Button
              type="button"
              variant="soft"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera size={16} />
              Take Photo
            </Button>
          </Flex>
        )}
      </Flex>
    );
  },
);

ImageUpload.displayName = "ImageUpload";

export default ImageUpload;
