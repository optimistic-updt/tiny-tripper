"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  Button,
  Card,
  Flex,
  Text,
  TextField,
  TextArea,
  Select,
  Switch,
  Callout,
  Heading,
} from "@radix-ui/themes";
import { CheckCircle, AlertTriangle } from "lucide-react";

type ActivityFormData = {
  name: string;
  description?: string;
  urgency?: "low" | "medium" | "high";
  location?: string;
  endDate?: string;
  isPublic?: boolean;
};

export default function CreateActivityPage() {
  const createActivity = useMutation(api.activities.createActivity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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
    },
  });
  const isPublic = watch("isPublic");

  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    console.log("submitting", data);

    try {
      await createActivity({
        name: data.name,
        description: data.description || undefined,
        urgency: data.urgency || undefined,
        location: data.location || undefined,
        endDate: data.endDate || undefined,
        isPublic: data.isPublic || false,
      });

      setSubmitStatus({
        type: "success",
        message: "Activity created successfully!",
      });
      reset();
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
    <div className="max-w-2xl mx-auto p-6">
      <Flex direction="column" gap="6">
        <div>
          <Heading as="h1" size="8" weight="bold">
            Create Activity
          </Heading>
          <Text size="3" color="gray">
            Create a new activity to share with others
          </Text>
        </div>

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

            <div>
              <Text size="2" weight="medium" mb="2">
                Urgency
              </Text>
              <Select.Root
                onValueChange={(value: "low" | "medium" | "high") =>
                  setValue("urgency", value)
                }
              >
                <Select.Trigger placeholder="Select urgency level" />
                <Select.Content>
                  <Select.Item value="low">Low</Select.Item>
                  <Select.Item value="medium">Medium</Select.Item>
                  <Select.Item value="high">High</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>

            <div>
              <Text size="2" weight="medium" mb="2">
                Location
              </Text>
              <TextField.Root
                {...register("location")}
                placeholder="Enter location"
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
                  checked={isPublic}
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
      </Flex>
    </div>
  );
}
