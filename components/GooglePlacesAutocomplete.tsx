"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { TextField } from "@radix-ui/themes";

interface GooglePlacesAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  apiKey: string;
}

export default function GooglePlacesAutocomplete({
  value = "",
  onChange,
  placeholder = "Enter location",
  apiKey,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

        await loader.load();

        if (inputRef.current && window.google?.maps?.places) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: ["establishment", "geocode"],
              fields: ["formatted_address", "name", "place_id"],
            },
          );

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address && onChange) {
              onChange(place.formatted_address);
            }
          });

          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Error loading Google Places API:", error);
      }
    };

    initializeGooglePlaces();
  }, [apiKey, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <TextField.Root
      ref={inputRef}
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      disabled={!isLoaded}
    />
  );
}
