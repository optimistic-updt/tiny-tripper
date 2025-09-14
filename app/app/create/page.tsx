"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
  Container,
} from "@radix-ui/themes";
import { CheckCircle, AlertTriangle } from "lucide-react";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import { env } from "@/env";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/app/routes";

type ActivityFormData = {
  name: string;
  description?: string;
  urgency?: "low" | "medium" | "high";
  location?: string;
  endDate?: string;
  isPublic?: boolean;
  rainApproved?: boolean;
  inHome?: boolean;
};

export default function CreateActivityPage() {
  const createActivity = useAction(api.activities.createActivity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();

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
    },
  });
  const isPublic = watch("isPublic");
  const rainApproved = watch("rainApproved");
  const inHome = watch("inHome");

  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    const tags = [];
    if (data.rainApproved) {
      tags.push("rain-approved");
    }
    if (data.inHome) {
      tags.push("At Home");
    }

    try {
      await createActivity({
        name: data.name,
        description: data.description || undefined,
        urgency: data.urgency || undefined,
        location: data.location || undefined,
        endDate: data.endDate || undefined,
        isPublic: data.isPublic || false,
        tags: tags.length > 0 ? tags : undefined,
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
    <Container className="max-w-2xl mx-auto" px="5">
      <Flex direction="column" gap="6">
        <div>
          <Heading as="h2" size="6" weight="bold">
            Create Activity
          </Heading>
          <Text size="3" color="gray">
            Create a new activity to share with others
          </Text>
        </div>

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
              />
              {errors.name && (
                <Text size="1" color="red" mt="1">
                  {errors.name.message}
                </Text>
              )}
            </div>

            <div>
              <Text size="2" weight="medium" mb="2">
                Description
              </Text>
              <TextArea
                {...register("description")}
                placeholder="Describe your activity..."
                rows={3}
              />
            </div>

            <Flex direction={"column"}>
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
            </Flex>

            <div>
              <Text size="2" weight="medium" mb="2">
                Location
              </Text>
              <GooglePlacesAutocomplete
                value={watch("location") || ""}
                onChange={(value) => setValue("location", value)}
                placeholder="Enter location"
                apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              />
            </div>

            <div>
              <Text size="2" weight="medium" mb="2">
                End Date
              </Text>
              <TextField.Root {...register("endDate")} type="datetime-local" />
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
                  ? "Anyone can see this activity"
                  : "Only you can see this activity"}
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
    </Container>
  );
}
