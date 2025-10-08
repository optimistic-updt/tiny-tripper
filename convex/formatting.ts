import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { RawActivity } from "./scraping";
import type { Doc, Id } from "./_generated/dataModel";

export interface StandardizedActivity {
  name: string;
  description?: string;
  urgency: "low" | "medium" | "high";
  isPublic: boolean;
  location?: {
    name: string;
    formattedAddress: string;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country_code?: string;
    // placeId, latitude, longitude to be added by geocoding step
  };
  startDate?: string;
  endDate?: string;
  tags?: string[];
  imageURL?: string;
  // embedding and imageId to be added in later steps
}

/**
 * Validate and normalize date string to ISO 8601 format
 * Returns undefined if date is invalid
 */
function validateDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;

  try {
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateStr}`);
      return undefined;
    }
    // Return ISO format
    return date.toISOString();
  } catch (error) {
    console.warn(`Failed to parse date: ${dateStr}`, error);
    return undefined;
  }
}

/**
 * Normalize tags: deduplicate, lowercase, trim
 */
function normalizeTags(tags: string[] | undefined): string[] | undefined {
  if (!tags || tags.length === 0) return undefined;

  const normalized = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  // Deduplicate
  const unique = Array.from(new Set(normalized));

  return unique.length > 0 ? unique : undefined;
}

/**
 * Standardize and format rough scraping results into the complete activities schema
 */
export const standardizeActivities = internalMutation({
  args: {
    rawActivities: v.array(v.any()),
    config: v.object({
      urgencyDefault: v.optional(
        v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      ),
      isPublic: v.optional(v.boolean()),
    }),
  },
  handler: async (_ctx, args): Promise<StandardizedActivity[]> => {
    const standardized: StandardizedActivity[] = [];

    for (const raw of args.rawActivities as RawActivity[]) {
      // Validate required fields
      if (!raw.name || typeof raw.name !== "string" || raw.name.trim().length === 0) {
        console.warn("Skipping activity without valid name:", raw);
        continue;
      }

      // Validate and format location data
      let location: StandardizedActivity["location"] | undefined = undefined;
      if (raw.location) {
        // Ensure at minimum name and formattedAddress are present
        if (raw.location.name || raw.location.formattedAddress) {
          location = {
            name: raw.location.name || "",
            formattedAddress: raw.location.formattedAddress || "",
            street_address: raw.location.street_address,
            city: raw.location.city,
            state_province: raw.location.state_province,
            postal_code: raw.location.postal_code,
            country_code: raw.location.country_code,
          };
        }
      }

      // Build standardized activity with defaults
      const activity: StandardizedActivity = {
        name: raw.name.trim(),
        description: raw.description?.trim(),
        urgency: args.config.urgencyDefault || "medium",
        isPublic: args.config.isPublic ?? true,
        location,
        startDate: validateDate(raw.startDate),
        endDate: validateDate(raw.endDate),
        tags: normalizeTags(raw.tags),
        imageURL: raw.imageURL,
      };

      standardized.push(activity);
    }

    console.log(
      `Standardized ${standardized.length} of ${args.rawActivities.length} activities`,
    );

    return standardized;
  },
});

/**
 * Merge standardized activities with processed data (images, geocoding, embeddings)
 * into complete activity records ready for database import
 */
export const mergeActivityData = internalMutation({
  args: {
    activities: v.array(v.any()),
    images: v.any(), // Record<number, Id<"_storage">>
    geocoded: v.any(), // Record<number, GeocodeResult>
    embeddings: v.any(), // Record<number, number[]>
  },
  handler: async (
    _ctx,
    args,
  ): Promise<Omit<Doc<"activities">, "_id" | "_creationTime">[]> => {
    const activities = args.activities as StandardizedActivity[];
    const images = args.images as Record<number, Id<"_storage">>;
    const geocoded = args.geocoded as Record<
      number,
      {
        latitude: number;
        longitude: number;
        placeId: string;
        formattedAddress: string;
        street_address?: string;
        city?: string;
        state_province?: string;
        postal_code?: string;
        country_code?: string;
      }
    >;
    const embeddings = args.embeddings as Record<number, number[]>;

    console.log(`Merging data for ${activities.length} activities`);

    const merged: Omit<Doc<"activities">, "_id" | "_creationTime">[] =
      activities.map((activity, i) => {
        const result: Omit<Doc<"activities">, "_id" | "_creationTime"> = {
          name: activity.name,
          description: activity.description,
          urgency: activity.urgency,
          isPublic: activity.isPublic,
          location: activity.location,
          startDate: activity.startDate,
          endDate: activity.endDate,
          tags: activity.tags,
        };

      // Merge image storage ID
      if (images[i]) {
        result.imageId = images[i];
      }
      // Note: imageURL is not included in MergedActivity interface, so it's automatically removed

      // Merge geocoded data
      if (geocoded[i] && result.location) {
        result.location = {
          ...result.location,
          latitude: geocoded[i].latitude,
          longitude: geocoded[i].longitude,
          placeId: geocoded[i].placeId,
          // Override formattedAddress from geocoding if available
          formattedAddress:
            geocoded[i].formattedAddress || result.location.formattedAddress,
          // Merge other address components (prefer geocoded data)
          street_address:
            geocoded[i].street_address || result.location.street_address,
          city: geocoded[i].city || result.location.city,
          state_province:
            geocoded[i].state_province || result.location.state_province,
          postal_code: geocoded[i].postal_code || result.location.postal_code,
          country_code:
            geocoded[i].country_code || result.location.country_code,
        };
      }

      // Merge embedding
      if (embeddings[i]) {
        result.embedding = embeddings[i];
      }

      return result;
    });

    console.log(
      `Merged complete. ${Object.keys(images).length} with images, ${Object.keys(geocoded).length} with geocoding, ${Object.keys(embeddings).length} with embeddings`,
    );

    return merged;
  },
});
