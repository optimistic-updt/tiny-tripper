"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Flex, Text, Box } from "@radix-ui/themes";
import { Camera, Upload, X } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";

interface ImageUploadProps {
  value?: Id<"_storage">;
  onChange: (storageId: Id<"_storage"> | undefined) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
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
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });

      const { storageId } = await result.json();
      onChange(storageId);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

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
            <Image
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
            <Flex gap="2" mt="3">
              <Button
                type="button"
                onClick={handleUpload}
                loading={isUploading}
                disabled={isUploading}
              >
                Upload Image
              </Button>
              <Button type="button" variant="soft" onClick={handleRemove}>
                Change Image
              </Button>
            </Flex>
          )}

          {value && (
            <Text size="2" color="green" mt="2">
              Image uploaded successfully
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
}
