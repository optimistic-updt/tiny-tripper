"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { TextField } from "@radix-ui/themes";

interface GooglePlacesAutocompleteProps {
  value?: string;
  onChange?: (value: string, place?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  apiKey: string;
  types?: string[];
  componentRestrictions?: { country?: string | string[] | null };
}

export default function GooglePlacesAutocomplete({
  value = "",
  onChange,
  placeholder = "Enter location",
  apiKey,
  types = ["establishment", "geocode"],
  componentRestrictions,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const handlePlaceChanged = useCallback(() => {
    if (autocompleteRef.current && onChange) {
      const place = autocompleteRef.current.getPlace();
      
      if (place.formatted_address) {
        onChange(place.formatted_address, place);
      }
      
      // Create new session token for next search
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
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

        await loader.load();

        // Import the Places library using the modern approach
        const { Autocomplete, AutocompleteSessionToken } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        if (inputRef.current) {
          // Create session token for billing optimization
          sessionTokenRef.current = new AutocompleteSessionToken();

          // Create autocomplete with enhanced options
          const autocompleteOptions: google.maps.places.AutocompleteOptions = {
            types: types,
            fields: [
              "formatted_address", 
              "name", 
              "place_id", 
              "geometry", 
              "address_components"
            ],
          };

          // Add component restrictions if provided
          if (componentRestrictions?.country !== undefined) {
            autocompleteOptions.componentRestrictions = {
              country: componentRestrictions.country
            };
          }

          autocompleteRef.current = new Autocomplete(
            inputRef.current,
            autocompleteOptions
          );

          autocompleteRef.current.addListener("place_changed", handlePlaceChanged);

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
  }, [apiKey, types, componentRestrictions, handlePlaceChanged]);

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
