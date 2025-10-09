"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import type { StandardizedActivity } from "./formatting";
import { env } from "./env";

interface GeocodeResult {
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

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodeResponse {
  results: Array<{
    address_components: AddressComponent[];
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
  }>;
  status: string;
}

/**
 * Parse address components from Google Maps geocoding response
 */
function parseAddressComponents(
  components: AddressComponent[],
): Partial<GeocodeResult> {
  const result: Partial<GeocodeResult> = {};

  for (const component of components) {
    if (component.types.includes("street_number")) {
      result.street_address = component.long_name;
    } else if (component.types.includes("route")) {
      result.street_address = result.street_address
        ? `${result.street_address} ${component.long_name}`
        : component.long_name;
    } else if (
      component.types.includes("locality") ||
      component.types.includes("postal_town")
    ) {
      result.city = component.long_name;
    } else if (component.types.includes("administrative_area_level_1")) {
      result.state_province = component.long_name;
    } else if (component.types.includes("postal_code")) {
      result.postal_code = component.long_name;
    } else if (component.types.includes("country")) {
      result.country_code = component.short_name;
    }
  }

  return result;
}

/**
 * Geocode a single address using Google Maps Geocoding API
 */
async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `Geocoding API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as GoogleGeocodeResponse;

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.warn(`Geocoding failed for address: ${address}. Status: ${data.status}`);
      return null;
    }

    const result = data.results[0];
    const addressComponents = parseAddressComponents(result.address_components);

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      placeId: result.place_id,
      formattedAddress: result.formatted_address,
      ...addressComponents,
    };
  } catch (error) {
    console.error(`Failed to geocode address: ${address}`, error);
    return null;
  }
}

/**
 * Geocode addresses for all activities with location data
 * Returns a map of activity index to geocoded location data
 */
export const geocodeAddresses = internalAction({
  args: {
    activities: v.array(v.any()),
  },
  handler: async (_ctx, args): Promise<Record<number, GeocodeResult>> => {
    const activities = args.activities as StandardizedActivity[];
    const geocodedMap: Record<number, GeocodeResult> = {};

    console.log(`Geocoding addresses for ${activities.length} activities`);

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];

      // Skip if no location data
      if (!activity.location?.formattedAddress) {
        continue;
      }

      try {
        console.log(
          `Geocoding activity ${i}: ${activity.name} at ${activity.location.formattedAddress}`,
        );

        const geocoded = await geocodeAddress(
          activity.location.formattedAddress,
        );

        if (geocoded) {
          geocodedMap[i] = geocoded;
          console.log(
            `Successfully geocoded activity ${i}: ${geocoded.latitude}, ${geocoded.longitude}`,
          );
        } else {
          console.warn(
            `Failed to geocode activity ${i} (${activity.name}): no results`,
          );
        }

        // Add small delay to avoid rate limiting (50 requests per second limit)
        await new Promise((resolve) => setTimeout(resolve, 25));
      } catch (error) {
        console.error(
          `Failed to geocode activity ${i} (${activity.name}):`,
          error,
        );
        // Continue processing other addresses
      }
    }

    console.log(
      `Geocoding complete. Successfully geocoded ${Object.keys(geocodedMap).length} of ${activities.length} activities`,
    );

    return geocodedMap;
  },
});
