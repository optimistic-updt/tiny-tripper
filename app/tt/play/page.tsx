"use client";

import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Heading,
  Text,
  Card,
  Box,
  VisuallyHidden,
  Flex,
  DropdownMenu,
  IconButton,
  Switch,
  Select,
  Container,
  Theme,
} from "@radix-ui/themes";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { EyeOff, MapPin, SlidersHorizontal } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import styles from "./3d_button.module.css";

// Radius options in meters
const RADIUS_OPTIONS = [
  { value: 2000, label: "2 km" },
  { value: 3000, label: "3 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
  { value: 50000, label: "50 km" },
];

type Recommendation = Doc<"activities"> & { score: number };

export default function PlayPage() {
  const { isAuthenticated } = useConvexAuth();
  const [recommendationHistory, setRecommendationHistory] = useState<
    Recommendation[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [excludeIds, setExcludeIds] = useState<Id<"activities">[]>([]);
  const [filters, setFilters] = useState({
    atHome: false,
    rainproof: false,
  });
  const [randomSeed, setRandomSeed] = useState(() =>
    Math.floor(Math.random() * 1000000),
  );

  // Location state
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [searchRadius, setSearchRadius] = useState(5000);

  // Load filters from sessionStorage on mount
  useEffect(() => {
    const savedFilters = sessionStorage.getItem("activity-filters");
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error("Failed to parse saved filters:", error);
      }
    }
  }, []);

  // Save filters to sessionStorage when they change
  useEffect(() => {
    sessionStorage.setItem("activity-filters", JSON.stringify(filters));
    // Reset recommendation history and excludeIds when filters change
    setRecommendationHistory([]);
    setCurrentIndex(-1);
    setExcludeIds([]);
    // Generate new random seed
    setRandomSeed(Math.floor(Math.random() * 1000000));
  }, [filters]);

  // Get user location when enabled
  useEffect(() => {
    if (!locationEnabled) {
      setUserLocation(null);
      setLocationError(null);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationLoading(false);
      },
      (err) => {
        setLocationError(err.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, [locationEnabled]);

  // Reset recommendations when location settings change
  useEffect(() => {
    setRecommendationHistory([]);
    setCurrentIndex(-1);
    setExcludeIds([]);
    setRandomSeed(Math.floor(Math.random() * 1000000));
  }, [locationEnabled, userLocation, searchRadius]);

  const recommendation = useQuery(api.activities.getRecommendation, {
    excludeIds: excludeIds,
    filters: filters,
    randomSeed: randomSeed,
    userLocation:
      locationEnabled && userLocation
        ? { latitude: userLocation.lat, longitude: userLocation.lng }
        : undefined,
    maxDistanceMeters:
      locationEnabled && userLocation ? searchRadius : undefined,
  });

  // Mutations for user preferences
  const setHidden = useMutation(api.userActivityPreferences.setActivityHidden);
  const setUrgency = useMutation(
    api.userActivityPreferences.setActivityUrgency,
  );

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

      // Generate new random seed for next recommendation
      setRandomSeed(Math.floor(Math.random() * 1000000));
    }
  };

  const handleBackClick = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentActivity = recommendationHistory[currentIndex] || null;
  const canGoBack = currentIndex > 0;

  // Get user's preference for current activity
  const userPreference = useQuery(
    api.userActivityPreferences.getActivityUserPreference,
    currentActivity ? { activityId: currentActivity._id } : "skip",
  );

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
    <Flex
      direction="column"
      align="center"
      height="100%"
      minHeight="0"
      flexGrow="1"
      overflowY="auto"
      p="5"
    >
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
                {isAuthenticated ? (
                  <Flex gap="2" align="center">
                    {/* Priority Dropdown */}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        <Button
                          size="2"
                          variant="soft"
                          color={getUrgencyColor(
                            userPreference?.urgencyOverride ??
                              currentActivity.urgency,
                          )}
                        >
                          {(
                            userPreference?.urgencyOverride ??
                            currentActivity.urgency
                          ).toUpperCase()}
                          <DropdownMenu.TriggerIcon />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item
                          onSelect={() =>
                            setUrgency({
                              activityId: currentActivity._id,
                              urgency: "high",
                            })
                          }
                        >
                          High
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() =>
                            setUrgency({
                              activityId: currentActivity._id,
                              urgency: "medium",
                            })
                          }
                        >
                          Medium
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() =>
                            setUrgency({
                              activityId: currentActivity._id,
                              urgency: "low",
                            })
                          }
                        >
                          Low
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item
                          onSelect={() =>
                            setUrgency({
                              activityId: currentActivity._id,
                              urgency: null,
                            })
                          }
                        >
                          Reset to default ({currentActivity.urgency})
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>

                    {/* Hide Button */}
                    <IconButton
                      size="2"
                      variant="ghost"
                      color="gray"
                      onClick={() => {
                        setHidden({
                          activityId: currentActivity._id,
                          hidden: true,
                        });
                        handlePlayClick();
                      }}
                      title="Hide this activity"
                    >
                      <EyeOff size={16} />
                    </IconButton>
                  </Flex>
                ) : (
                  <Badge
                    size="2"
                    color={getUrgencyColor(currentActivity.urgency)}
                    className="ml-4"
                  >
                    {currentActivity.urgency.toUpperCase()}
                  </Badge>
                )}
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
                    <Text size="3">
                      📍{" "}
                      <a
                        href={
                          currentActivity.location.latitude &&
                          currentActivity.location.longitude
                            ? `https://www.google.com/maps/search/?api=1&query=${currentActivity.location.latitude},${currentActivity.location.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentActivity.location.formattedAddress)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {currentActivity.location.formattedAddress}
                      </a>
                    </Text>
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

              {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-200">
                  <Text size="2" color="gray">
                    Sign in to hide activities or set your own priority levels.
                  </Text>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card size="4" className="p-8 text-center">
            {/* {recommendation === undefined ?
              <div className="space-y-4">
                <Spinner size="3" />
                <Text size="4" color="gray">
                  Loading recommendations...
                </Text>
              </div> : null} */}

            {recommendation === null ? (
              <div className="space-y-4">
                <Text size="6">🔍</Text>
                <Heading as="h3" size="5">
                  No matching activities
                </Heading>
                <Text size="4" color="gray">
                  No activities found with the current filters. Try adjusting
                  your filters or adding new activities.
                </Text>
              </div>
            ) : null}

            {recommendation !== null ? (
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
            ) : null}
          </Card>
        )}

        <div>
          {/* Location Toggle */}
          <Flex align="center" gap="3" mt="4" justify="center">
            <MapPin size={20} />
            <Text size="3">Enable location</Text>
            <Switch
              checked={locationEnabled}
              onCheckedChange={setLocationEnabled}
            />
          </Flex>

          {locationLoading && (
            <Text size="2" color="gray">
              Getting location...
            </Text>
          )}

          {locationError && (
            <Text size="2" color="red">
              {locationError}
            </Text>
          )}

          {/* Radius Selector (shown only when location enabled and available) */}
          {locationEnabled && userLocation && (
            <Flex align="center" gap="3" mt="2" justify="center">
              <Text size="2" color="gray">
                Search radius:
              </Text>
              <Select.Root
                value={String(searchRadius)}
                onValueChange={(v) => setSearchRadius(Number(v))}
              >
                <Select.Trigger />
                <Select.Content>
                  {RADIUS_OPTIONS.map((opt) => (
                    <Select.Item key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>
          )}
        </div>

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
      <Flex justify="center" gap="4" style={{ marginTop: "auto" }}>
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

        <Drawer.Root>
          <Drawer.Trigger asChild>
            <Button size="4" variant="soft" radius="full">
              <SlidersHorizontal />
              <VisuallyHidden>Filters</VisuallyHidden>
            </Button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40" />
            <Drawer.Content className="bg-white h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-2xl">
              <Theme>
                <Container className="p-6">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
                  <Heading
                    as="h2"
                    size="5"
                    className="mb-6 text-center"
                    asChild
                  >
                    <Drawer.Title>Filter Activities</Drawer.Title>
                  </Heading>

                  <div className="space-y-6">
                    <Flex
                      justify="between"
                      align="center"
                      gap="4"
                      className="py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <Text as="p" size="4" weight="medium">
                          At home activities
                        </Text>
                        <Text as="p" size="2" color="gray">
                          Show only activities tagged &quot;at home&quot;
                        </Text>
                      </div>
                      <Switch
                        checked={filters.atHome}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, atHome: checked }))
                        }
                      />
                    </Flex>

                    <Flex
                      justify="between"
                      align="center"
                      gap="4"
                      className="py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <Text as="p" size="4" weight="medium">
                          Rainproof activities
                        </Text>
                        <Text as="p" size="2" color="gray">
                          Show only activities tagged &quot;rainproof&quot;
                        </Text>
                      </div>
                      <Switch
                        checked={filters.rainproof}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            rainproof: checked,
                          }))
                        }
                      />
                    </Flex>
                  </div>

                  {(filters.atHome || filters.rainproof) && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Button
                        size="2"
                        variant="soft"
                        color="gray"
                        onClick={() =>
                          setFilters({ atHome: false, rainproof: false })
                        }
                        className="w-full"
                      >
                        Clear all filters
                      </Button>
                    </div>
                  )}
                </Container>
              </Theme>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </Flex>
    </Flex>
  );
}
