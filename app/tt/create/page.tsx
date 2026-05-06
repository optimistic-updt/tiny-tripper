"use client";

import { useAction, useMutation } from "convex/react";
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
  SegmentedControl,
  Box,
} from "@radix-ui/themes";
import { CheckCircle, AlertTriangle, Lock, MapPin } from "lucide-react";
import { useAuth, SignInButton, useUser } from "@clerk/nextjs";
import { Loader } from "@googlemaps/js-api-loader";
import { env } from "@/env";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import TagCombobox from "@/components/TagCombobox";
import ImageUpload, { type ImageUploadHandle } from "@/components/ImageUpload";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/app/routes";
import type { Id } from "@/convex/_generated/dataModel";
import { otel } from "@/lib/otel";

type PlaceLike = {
  name?: string;
  place_id?: string;
  formatted_address?: string;
  geometry?: { location?: { lat(): number; lng(): number } };
  address_components?: google.maps.GeocoderAddressComponent[];
};

function placeToLocation(place: PlaceLike, fallbackName: string) {
  const addressComponents = place.address_components || [];
  const getComponent = (type: string) =>
    addressComponents.find((c) => c.types.includes(type))?.long_name;

  return {
    name: place.name || fallbackName,
    placeId: place.place_id ?? "",
    formattedAddress: place.formatted_address ?? fallbackName,
    latitude: place.geometry?.location?.lat() ?? undefined,
    longitude: place.geometry?.location?.lng() ?? undefined,
    street_address:
      getComponent("street_number") && getComponent("route")
        ? `${getComponent("street_number")} ${getComponent("route")}`
        : getComponent("route"),
    city: getComponent("locality") || getComponent("sublocality"),
    state_province: getComponent("administrative_area_level_1"),
    postal_code: getComponent("postal_code"),
    country_code: addressComponents.find((c) => c.types.includes("country"))
      ?.short_name,
  };
}

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
  sourceUrl?: string;
};

export default function CreateActivityPage() {
  const createActivity = useAction(api.activities.createActivity);
  const startSingleScrape = useMutation(
    api.scrapeWorkflow.startSingleScrape,
  );
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const canScrapeUrl =
    user?.primaryEmailAddress?.emailAddress === "kev4tech@gmail.com";
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const onScrapeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = scrapeUrl.trim();
    if (!url) return;

    setIsScraping(true);
    setScrapeStatus(null);
    try {
      await startSingleScrape({
        url,
        workflowConfig: { autoImport: true },
      });
      setScrapeStatus({
        type: "success",
        message: "Scrape started. The activity will appear once import finishes.",
      });
      setScrapeUrl("");
    } catch (error) {
      otel.captureException(error, { context: "create_single_scrape" });
      setScrapeStatus({
        type: "error",
        message: "Failed to start scrape. Please try again.",
      });
    } finally {
      setIsScraping(false);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
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

  const handleUseCurrentLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loader = new Loader({
            apiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            version: "weekly",
            libraries: ["places"],
          });
          const { Geocoder } = (await loader.importLibrary(
            "geocoding",
          )) as google.maps.GeocodingLibrary;
          const geocoder = new Geocoder();
          const { results } = await geocoder.geocode({
            location: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
          });

          if (!results || results.length === 0) {
            setLocationError("Couldn't find an address for your location");
            return;
          }

          const result = results[0];
          setValue(
            "location",
            placeToLocation(
              {
                place_id: result.place_id,
                formatted_address: result.formatted_address,
                address_components: result.address_components,
                geometry: {
                  location: {
                    lat: () => pos.coords.latitude,
                    lng: () => pos.coords.longitude,
                  },
                },
              },
              result.formatted_address,
            ),
          );
        } catch (error) {
          otel.captureException(error, { context: "create_location_lookup" });
          setLocationError("Failed to look up your location");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationError(err.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    const tags = [...(data.tags || [])];
    if (data.rainApproved) {
      tags.push("rain approved");
    }
    if (data.inHome) {
      tags.push("at home");
    }

    try {
      // Auto-upload pending image if user forgot to click upload
      if (imageUploadRef.current) {
        await imageUploadRef.current.uploadPendingImage();
      }

      await createActivity({
        name: data.name,
        description: data.description || undefined,
        urgency: isSignedIn ? data.urgency || "medium" : undefined,
        location: data.location || undefined,
        endDate: data.endDate || undefined,
        isPublic: isSignedIn ? (data.isPublic ?? true) : true,
        tags: tags.length > 0 ? tags : undefined,
        imageId: data.imageId || undefined,
        sourceUrl: data.sourceUrl?.trim() || undefined,
      });

      setSubmitStatus({
        type: "success",
        message: "Activity created successfully!",
      });
      reset();
      router.push(ROUTES.activities);
    } catch (error) {
      otel.captureException(error, { context: "create_activity_submit" });
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
      px="5"
      pt="3"
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

        {canScrapeUrl && (
          <form onSubmit={onScrapeSubmit}>
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Create from URL
              </Text>
              <Flex gap="2" align="start">
                <Box flexGrow="1">
                  <TextField.Root
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    type="url"
                    placeholder="https://…"
                    size="3"
                  />
                </Box>
                <Button
                  type="submit"
                  loading={isScraping}
                  disabled={isScraping || !scrapeUrl.trim()}
                >
                  Scrape
                </Button>
              </Flex>
              <Text size="1" color="gray">
                Runs a single-page scrape and auto-imports the activity.
              </Text>
              {scrapeStatus && (
                <Callout.Root
                  color={scrapeStatus.type === "success" ? "green" : "red"}
                >
                  <Callout.Icon>
                    {scrapeStatus.type === "success" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                  </Callout.Icon>
                  <Callout.Text>{scrapeStatus.message}</Callout.Text>
                </Callout.Root>
              )}
            </Flex>
          </form>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
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

            <div style={{ opacity: !isSignedIn ? 0.5 : 1 }}>
              <Flex align="center" gap="3">
                {!isSignedIn && <Lock size={14} className="text-gray-400" />}
                <Switch
                  checked={isPublic}
                  onCheckedChange={(checked) => setValue("isPublic", checked)}
                  disabled={!isSignedIn}
                />
                <Text
                  size="2"
                  weight="medium"
                  color={!isSignedIn ? "gray" : undefined}
                >
                  {isPublic ? "Public Activity" : "Private Activity"}
                </Text>
              </Flex>
              <Text size="1" color="gray" mt="1">
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <span className="cursor-pointer underline hover:no-underline">
                      Sign in to create private activities that only you can see
                    </span>
                  </SignInButton>
                ) : isPublic ? (
                  <>Anyone can see this activity</>
                ) : (
                  <>Only you can see this activity</>
                )}
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

            <Flex
              direction={"column"}
              style={{ opacity: !isSignedIn ? 0.5 : 1 }}
            >
              <Flex align="center" gap="2" mb="2">
                {!isSignedIn && <Lock size={14} className="text-gray-400" />}
                <Text size="2" weight="medium">
                  Urgency
                </Text>
              </Flex>
              <SegmentedControl.Root
                defaultValue="medium"
                size="3"
                disabled={!isSignedIn}
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
              <Text size="1" color="gray" mt="1">
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <span className="cursor-pointer underline hover:no-underline">
                      Sign in to set urgency and prioritize your activities
                    </span>
                  </SignInButton>
                ) : (
                  <>Higher urgency activities appear first in recommendations</>
                )}
              </Text>
            </Flex>

            <div>
              <Text size="2" weight="medium" mb="2">
                Location
              </Text>
              <GooglePlacesAutocomplete
                value={watch("location")?.name || ""}
                onChange={(value, place) => {
                  if (place) {
                    setValue("location", placeToLocation(place, value));
                  } else {
                    setValue("location.name", value);
                  }
                }}
                placeholder="Enter location"
              />
              <Flex align="center" gap="2" mt="2">
                <Button
                  type="button"
                  variant="ghost"
                  size="1"
                  onClick={handleUseCurrentLocation}
                  loading={locationLoading}
                >
                  <MapPin size={12} /> Use my current location
                </Button>
                {locationError && (
                  <Text size="1" color="red">
                    {locationError}
                  </Text>
                )}
              </Flex>
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
                End Date
              </Text>
              <TextField.Root
                {...register("endDate")}
                type="datetime-local"
                size="3"
              />
            </div>

            <div>
              <Text size="2" weight="medium" mb="2">
                Source URL
              </Text>
              <TextField.Root
                {...register("sourceUrl")}
                type="url"
                placeholder="https://…"
                size="3"
              />
              <Text size="1" color="gray" mt="1">
                Optional — link to the page this activity is from.
              </Text>
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
