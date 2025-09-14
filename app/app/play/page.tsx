"use client";

import { useState } from "react";
import {
  Button,
  Heading,
  Text,
  Card,
  Badge,
  Spinner,
  Box,
  VisuallyHidden,
  Flex,
} from "@radix-ui/themes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import styles from "./3d_button.module.css";
import { HamburgerIcon } from "lucide-react";

interface Activity {
  _id: Id<"activities">;
  name: string;
  description?: string;
  urgency: "low" | "medium" | "high";
  location?: string;
  endDate?: string;
  isPublic?: boolean;
  userId?: string;
  tags?: string[];
  score: number;
}

export default function PlayPage() {
  const [recommendationHistory, setRecommendationHistory] = useState<
    Activity[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [excludeIds, setExcludeIds] = useState<Id<"activities">[]>([]);

  const recommendation = useQuery(api.activities.getRecommendation, {
    excludeIds: excludeIds,
  });

  const handlePlayClick = () => {
    if (recommendation) {
      // Add current recommendation to history
      const newHistory = [
        ...recommendationHistory.slice(0, currentIndex + 1),
        recommendation,
      ];
      setRecommendationHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);

      // Add current recommendation to exclude list for next query
      setExcludeIds((prev) => [...prev, recommendation._id]);
    }
  };

  const handleBackClick = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentActivity = recommendationHistory[currentIndex] || null;
  const canGoBack = currentIndex > 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "red";
      case "medium":
        return "yellow";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  const getDaysUntilEnd = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col items-center min-h-screen">
      {/* <div className="text-center mb-8">
        <Heading as="h1" size="8" weight="bold">
          Create Activity
        </Heading>
        <Text size="3" color="gray">
          Create a new activity to share with others
        </Text>
      </div> */}

      <div className="space-y-6">
        {/* Activity Display */}
        {currentActivity ? (
          <Card size="4" className="p-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <Heading as="h2" size="6" className="flex-1">
                  {currentActivity.name}
                </Heading>
                <Badge
                  size="2"
                  color={getUrgencyColor(currentActivity.urgency)}
                  className="ml-4"
                >
                  {currentActivity.urgency.toUpperCase()}
                </Badge>
              </div>

              {currentActivity.description && (
                <Text size="4" color="gray">
                  {currentActivity.description}
                </Text>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentActivity.location && (
                  <div>
                    <Text size="2" weight="bold" color="gray">
                      Location
                    </Text>
                    <Text size="3">📍 {currentActivity.location}</Text>
                  </div>
                )}

                {currentActivity.endDate && (
                  <div>
                    <Text size="2" weight="bold" color="gray">
                      End Date
                    </Text>
                    <Text size="3">
                      📅 {formatDate(currentActivity.endDate)}
                      {(() => {
                        const days = getDaysUntilEnd(currentActivity.endDate);
                        if (days !== null) {
                          if (days === 0) return " (Today!)";
                          if (days === 1) return " (Tomorrow)";
                          if (days > 0 && days <= 7)
                            return ` (${days} days left)`;
                          if (days > 7) return ` (${days} days left)`;
                        }
                        return "";
                      })()}
                    </Text>
                  </div>
                )}
              </div>

              {currentActivity.tags && currentActivity.tags.length > 0 && (
                <div>
                  <Text
                    size="2"
                    weight="bold"
                    color="gray"
                    className="block mb-2"
                  >
                    Tags
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {currentActivity.tags.map((tag, index) => (
                      <Badge key={index} size="1" color="blue">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <Text size="2" color="gray">
                  Recommendation Score: {Math.round(currentActivity.score)}{" "}
                  points
                </Text>
              </div>
            </div>
          </Card>
        ) : (
          <Card size="4" className="p-8 text-center">
            {recommendation === undefined ? (
              <div className="space-y-4">
                <Spinner size="3" />
                <Text size="4" color="gray">
                  Loading recommendations...
                </Text>
              </div>
            ) : (
              <div className="space-y-4">
                <Text size="6">🎯</Text>
                <Heading as="h3" size="5">
                  Ready to play?
                </Heading>
                <Text size="4" color="gray">
                  Click the Play button to get your first activity
                  recommendation!
                </Text>
              </div>
            )}
          </Card>
        )}

        {/* Status Messages */}
        {recommendation === null && excludeIds.length > 0 && (
          <Box className="text-center">
            <Text size="3" color="gray">
              No more recommendations available. You&apos;ve seen all the best
              activities! 🎉
            </Text>
          </Box>
        )}
      </div>

      {/* Controls */}
      <Flex
        justify="center"
        gap="4"
        style={{ marginTop: "auto", marginBottom: "80px" }}
      >
        <Button
          size="4"
          disabled={!canGoBack}
          onClick={handleBackClick}
          variant="soft"
          radius="full"
        >
          ← <VisuallyHidden>Back</VisuallyHidden>
        </Button>

        <button
          type="button"
          className={styles.pushable}
          onClick={handlePlayClick}
          onKeyUp={async ({ key }) => {
            if (key === "Enter") {
              handlePlayClick();
            }
          }}
        >
          <span className={styles.shadow}></span>
          <span className={styles.edge}></span>
          {/* Let's Play */}
          <span className={styles.front}> Let&apos;s Play </span>
        </button>

        <Button size="4" onClick={handleBackClick} variant="soft" radius="full">
          <HamburgerIcon />
          <VisuallyHidden>Filters</VisuallyHidden>
        </Button>
      </Flex>

      {/* History Counter */}
      {/* {recommendationHistory.length > 0 && (
          <Box className="text-center">
            <Text size="2" color="gray">
              Showing {currentIndex + 1} of {recommendationHistory.length}{" "}
              recommendations
            </Text>
          </Box>
        )} */}
    </div>
  );
}
