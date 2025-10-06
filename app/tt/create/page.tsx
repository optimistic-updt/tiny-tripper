"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import {
  Button,
  Flex,
  Text,
  TextField,
  TextArea,
  Switch,
  Callout,
  Heading,
  // SegmentedControl,
  Box,
} from "@radix-ui/themes";
import { CheckCircle, AlertTriangle } from "lucide-react";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import TagCombobox from "@/components/TagCombobox";
import ImageUpload, { type ImageUploadHandle } from "@/components/ImageUpload";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/app/routes";
import type { Id } from "@/convex/_generated/dataModel";

type ActivityFormData = {
  name: string;
  description?: string;
  urgency?: "low" | "medium" | "high";
  location?: {
    name: string;
    placeId: string;
    formattedAddress: string;
    latitude: number | undefined;
    longitude: number | undefined;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country_code?: string;
  };
  endDate?: string;
  isPublic?: boolean;
  rainApproved?: boolean;
  inHome?: boolean;
  tags?: string[];
  imageId?: Id<"_storage">;
};

export default function CreateActivityPage() {
  const createActivity = useAction(api.activities.createActivity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();
  const imageUploadRef = useRef<ImageUploadHandle>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ActivityFormData>({
    defaultValues: {
      isPublic: true,
      rainApproved: false,
      inHome: false,
      tags: [],
      imageId: undefined,
    },
  });
  const isPublic = watch("isPublic");
  const rainApproved = watch("rainApproved");
  const inHome = watch("inHome");
  const tags = watch("tags") || [];
  const imageId = watch("imageId");

  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    const tags = [...(data.tags || [])];
    if (data.rainApproved) {
      tags.push("rain-approved");
    }
    if (data.inHome) {
      tags.push("At Home");
    }

    try {
      // Auto-upload pending image if user forgot to click upload
      if (imageUploadRef.current) {
        await imageUploadRef.current.uploadPendingImage();
      }

      await createActivity({
        name: data.name,
        description: data.description || undefined,
        urgency: data.urgency || undefined,
        location: data.location || undefined,
        endDate: data.endDate || undefined,
        isPublic: data.isPublic || false,
        tags: tags.length > 0 ? tags : undefined,
        imageId: data.imageId || undefined,
      });

      setSubmitStatus({
        type: "success",
        message: "Activity created successfully!",
      });
      reset();
      router.push(ROUTES.activities);
    } catch {
      setSubmitStatus({
        type: "error",
        message: "Failed to create activity. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex
      direction="column"
      align="center"
      height="100%"
      minHeight="0"
      flexGrow="1"
      overflowY="auto"
      p="5"
    >
      <Flex direction="column" gap="4">
        <Box>
          <Heading as="h2" size="6" weight="bold">
            Create Activity
          </Heading>
          <Text size="3" color="gray">
            Create a new activity to share with others
          </Text>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            <div>
              <Text size="2" weight="medium" mb="2">
                Name *
              </Text>
              <TextField.Root
                {...register("name", { required: "Name is required" })}
                placeholder="Enter activity name"
                color={errors.name ? "red" : undefined}
                size="3"
              />
              {errors.name && (
                <Text size="1" color="red" mt="1">
                  {errors.name.message}
                </Text>
              )}
            </div>

            <div>
              <Flex align="center" gap="3">
                <Switch
                  checked={true}
                  onCheckedChange={(checked) => setValue("isPublic", checked)}
                />
                <Text size="2" weight="medium">
                  {isPublic ? "Public Activity" : "Private Activity"}
                </Text>
              </Flex>
              <Text size="1" color="gray" mt="1">
                {isPublic
                  ? "Anyone can see this activity (currently only Public)"
                  : "Only you can see this activity"}
              </Text>
            </div>

            <div>
              <Text size="2" weight="medium" mb="2">
                Description
              </Text>
              <TextArea
                {...register("description")}
                placeholder="Describe your activity..."
                rows={3}
                size="3"
              />
            </div>

            {/* will Come back */}
            {/* <Flex direction={"column"}>
              <Text size="2" weight="medium" mb="2">
                Urgency
              </Text>
              <SegmentedControl.Root
                defaultValue="medium"
                size="3"
                onValueChange={(value: "low" | "medium" | "high") =>
                  setValue("urgency", value)
                }
              >
                <SegmentedControl.Item value="low">Low</SegmentedControl.Item>
                <SegmentedControl.Item value="medium">
                  Medium
                </SegmentedControl.Item>
                <SegmentedControl.Item value="high">High</SegmentedControl.Item>
              </SegmentedControl.Root>
            </Flex> */}

            <div>
              <Text size="2" weight="medium" mb="2">
                Location
              </Text>
              <GooglePlacesAutocomplete
                value={watch("location")?.name || ""}
                onChange={(value, place) => {
                  if (place) {
                    const addressComponents = place.address_components || [];
                    const getComponent = (type: string) =>
                      addressComponents.find((c) => c.types.includes(type))
                        ?.long_name;

                    setValue("location", {
                      name: place.name || value,
                      placeId: place.place_id,
                      formattedAddress: place.formatted_address,
                      latitude: place?.geometry?.location?.lat() || undefined,
                      longitude: place?.geometry?.location?.lng() || undefined,
                      street_address:
                        getComponent("street_number") && getComponent("route")
                          ? `${getComponent("street_number")} ${getComponent("route")}`
                          : getComponent("route"),
                      city:
                        getComponent("locality") || getComponent("sublocality"),
                      state_province: getComponent(
                        "administrative_area_level_1",
                      ),
                      postal_code: getComponent("postal_code"),
                      country_code: addressComponents.find((c) =>
                        c.types.includes("country"),
                      )?.short_name,
                    });
                  } else {
                    setValue("location.name", value);
                  }
                }}
                placeholder="Enter location"
              />
            </div>

            <div>
              <Text size="2" weight="medium" mb="2">
                Tags
              </Text>
              <TagCombobox
                value={tags}
                onChange={(tags) => setValue("tags", tags)}
                placeholder="Add tags (comma-separated)..."
              />
              <Text size="1" color="gray" mt="1">
                Add tags to help categorize your activity. Type to search
                existing tags or create new ones.
              </Text>
            </div>

            <div>
              <Text size="2" weight="medium" mb="2">
                Image
              </Text>
              <ImageUpload
                ref={imageUploadRef}
                value={imageId}
                onChange={(storageId) => setValue("imageId", storageId)}
              />
              <Text size="1" color="gray" mt="1">
                Add an image to your activity (optional)
              </Text>
            </div>

            <div>
              <Text size="2" weight="medium" mb="2">
                End Date
              </Text>
              <TextField.Root
                {...register("endDate")}
                type="datetime-local"
                size="3"
              />
            </div>

            <div>
              <Flex align="center" gap="3">
                <Switch
                  checked={rainApproved}
                  onCheckedChange={(checked) =>
                    setValue("rainApproved", checked)
                  }
                />
                <Text size="2" weight="medium">
                  Rain-Approved
                </Text>
              </Flex>
              <Text size="1" color="gray" mt="1">
                {rainApproved
                  ? "This activity is suitable for rainy weather"
                  : "Not specifically designed for rainy weather"}
              </Text>
            </div>

            <div>
              <Flex align="center" gap="3">
                <Switch
                  checked={inHome}
                  onCheckedChange={(checked) => setValue("inHome", checked)}
                />
                <Text size="2" weight="medium">
                  In Home
                </Text>
              </Flex>
              <Text size="1" color="gray" mt="1">
                {inHome
                  ? "This activity can be done at home"
                  : "This activity requires going outside or to a specific location"}
              </Text>
            </div>

            <Flex gap="3" justify="end" mt="4">
              <Button type="button" variant="soft" onClick={() => reset()}>
                Reset
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Create Activity
              </Button>
            </Flex>
          </Flex>
        </form>

        {submitStatus && (
          <Callout.Root
            color={submitStatus.type === "success" ? "green" : "red"}
          >
            <Callout.Icon>
              {submitStatus.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
            </Callout.Icon>
            <Callout.Text>{submitStatus.message}</Callout.Text>
          </Callout.Root>
        )}
      </Flex>
    </Flex>
  );
}
