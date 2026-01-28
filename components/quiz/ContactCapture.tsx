"use client";

import { useState, useEffect } from "react";
import { Button, Flex, Heading, Text, TextField, Box } from "@radix-ui/themes";
import { useForm } from "react-hook-form";

interface ContactData {
  name: string;
  email: string;
  phone?: string;
  detectedCity?: string;
  detectedCountry?: string;
}

interface ContactCaptureProps {
  onSubmit: (data: ContactData) => void;
}

export function ContactCapture({ onSubmit }: ContactCaptureProps) {
  const [locationDetected, setLocationDetected] = useState<{
    city?: string;
    country?: string;
  }>({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ContactData>({
    mode: "onChange",
  });

  // IP-based geolocation detection
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        setLocationDetected({
          city: data.city,
          country: data.country_name,
        });
      } catch (error) {
        console.error("Location detection failed:", error);
      } finally {
        setIsDetectingLocation(false);
      }
    };

    detectLocation();
  }, []);

  const onFormSubmit = (data: ContactData) => {
    onSubmit({
      ...data,
      detectedCity: locationDetected.city,
      detectedCountry: locationDetected.country,
    });
  };

  return (
    <Flex direction="column" align="center" gap="6" className="w-full max-w-md">
      <Heading as="h2" size="5" align="center">
        Let&apos;s get started!
      </Heading>

      <Text size="2" color="gray" align="center">
        We&apos;ll send your personalized results to your email.
      </Text>

      {locationDetected.city && (
        <Box className="p-3 bg-green-50 rounded-lg w-full">
          <Text size="2" className="text-green-700">
            Detected location: {locationDetected.city}, {locationDetected.country}
          </Text>
        </Box>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
        <Flex direction="column" gap="4">
          <Box>
            <Text as="label" size="2" weight="medium">
              Your name *
            </Text>
            <TextField.Root
              size="3"
              placeholder="Jane"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <Text size="1" color="red">
                {errors.name.message}
              </Text>
            )}
          </Box>

          <Box>
            <Text as="label" size="2" weight="medium">
              Email address *
            </Text>
            <TextField.Root
              size="3"
              type="email"
              placeholder="jane@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <Text size="1" color="red">
                {errors.email.message}
              </Text>
            )}
          </Box>

          <Box>
            <Text as="label" size="2" weight="medium">
              Phone number (optional)
            </Text>
            <TextField.Root
              size="3"
              type="tel"
              placeholder="+61 4XX XXX XXX"
              {...register("phone")}
            />
          </Box>

          <Button
            type="submit"
            size="4"
            variant="solid"
            disabled={!isValid || isDetectingLocation}
          >
            {isDetectingLocation ? "Detecting location..." : "Continue to Quiz"}
          </Button>
        </Flex>
      </form>
    </Flex>
  );
}
