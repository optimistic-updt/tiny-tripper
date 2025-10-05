"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { TextField } from "@radix-ui/themes";
import { env } from "@/env";

const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type DefinedPlace = Required<
  Pick<
    google.maps.places.PlaceResult,
    | "name"
    | "place_id"
    | "formatted_address"
    | "geometry"
    | "address_components"
  >
>;

interface GooglePlacesAutocompleteProps {
  value?: string;
  onChange: (value: string, place?: DefinedPlace) => void;
  placeholder?: string;
  types?: string[];
  componentRestrictions?: { country?: string | string[] | null };
}

export default function GooglePlacesAutocomplete({
  value = "",
  onChange,
  placeholder = "Enter location",
  types = ["establishment", "geocode"],
  componentRestrictions,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const handlePlaceChanged = useCallback(() => {
    if (autocompleteRef.current && onChange) {
      console.log(
        "handlePlaceChanged",
        autocompleteRef.current,
        autocompleteRef.current.getPlace(),
      );

      const place = autocompleteRef.current.getPlace();

      if (place.formatted_address) {
        onChange(place.formatted_address, place as DefinedPlace);
      }

      // Create new session token for next search
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    }
  }, [onChange]);

  useEffect(() => {
    const initializeGooglePlaces = async () => {
      if (!apiKey) {
        console.error("Google Maps API key is required");
        return;
      }

      try {
        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"],
        });

        // Import the Places library using the modern approach
        const { Autocomplete, AutocompleteSessionToken } =
          (await loader.importLibrary("places")) as google.maps.PlacesLibrary;

        if (inputRef.current) {
          // Create session token for billing optimization
          sessionTokenRef.current = new AutocompleteSessionToken();

          // Create autocomplete with enhanced options
          const autocompleteOptions: google.maps.places.AutocompleteOptions = {
            types: types,
            fields: [
              "name",
              "place_id",
              "formatted_address",
              "address_components",
              "geometry",
            ],
          };

          // Add component restrictions if provided
          if (componentRestrictions?.country !== undefined) {
            autocompleteOptions.componentRestrictions = {
              country: componentRestrictions.country,
            };
          }

          autocompleteRef.current = new Autocomplete(
            inputRef.current,
            autocompleteOptions,
          );

          autocompleteRef.current.addListener(
            "place_changed",
            handlePlaceChanged,
          );

          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Error loading Google Places API:", error);
      }
    };

    initializeGooglePlaces();

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [types, componentRestrictions, handlePlaceChanged]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <TextField.Root
      ref={inputRef}
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      disabled={!isLoaded}
      size="3"
    />
  );
}
