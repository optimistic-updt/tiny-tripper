"use client";

import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Flex, Text, Box, Callout } from "@radix-ui/themes";
import { Camera, Upload, X, AlertCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { compressImage } from "@/lib/compressImage";

interface ImageUploadProps {
  value?: Id<"_storage">;
  onChange: (storageId: Id<"_storage"> | undefined) => void;
  onPendingImageChange?: (hasPendingImage: boolean) => void;
}

export interface ImageUploadHandle {
  uploadPendingImage: () => Promise<void>;
}

const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(
  ({ value, onChange, onPendingImageChange }, ref) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.activities.generateUploadUrl);

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

    const handleUpload = async () => {
      if (!selectedImage) return;

      setIsUploading(true);
      try {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();

        // Compress before uploading
        let body: Blob = selectedImage;
        let contentType = selectedImage.type;
        try {
          body = await compressImage(selectedImage);
          contentType = "image/webp";
        } catch (err) {
          console.error("Image compression failed, uploading raw file:", err);
        }

        // Upload file
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
