"use client";

import { useState, useCallback } from "react";
import { Drawer } from "vaul";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Badge,
  Container,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Text,
  Theme,
} from "@radix-ui/themes";
import { ArrowDownAZ, ArrowDownZA, Clock } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import {
  formatDate,
  getUrgencyColor,
  getDaysUntilEnd,
} from "@/lib/activity-format";

type SortOption = "alpha-asc" | "alpha-desc" | "latest";

const SORT_ICON: Record<SortOption, typeof Clock> = {
  "alpha-asc": ArrowDownAZ,
  "alpha-desc": ArrowDownZA,
  latest: Clock,
};

export default function ActivitiesPage() {
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const allActivities = useQuery(api.activities.listActivities, {
    sort: sortBy,
  });
  const [searchResults, setSearchResults] = useState<Doc<"activities">[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<Doc<"activities"> | null>(null);

  const handleSearchResults = useCallback((results: Doc<"activities">[]) => {
    setSearchResults(results);
    setIsSearchActive(true);
  }, []);

  const handleSearchCleared = useCallback(() => {
    setSearchResults([]);
    setIsSearchActive(false);
  }, []);

  const displayActivities = isSearchActive ? searchResults : allActivities;
  const SortIcon = SORT_ICON[sortBy];

  // Show loading state while data is being fetched
  if (allActivities === undefined) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        height="100%"
        p="5"
      >
        <Spinner size="3" />
        <Text size="4" color="gray" mt="4">
          Loading activities...
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      align="center"
      height="100%"
      minHeight="0"
      flexGrow="1"
      overflowY="auto"
      overflowX="hidden"
      width="100%"
      px="5"
      pt="3"
    >
      <Flex gap="2" width="100%" className="mb-4">
        <div className="flex-1 min-w-0">
          <SearchBar
            onSearchResults={handleSearchResults}
            onSearchCleared={handleSearchCleared}
          />
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton size="3" variant="soft" color="gray" aria-label="Sort">
              <SortIcon size={16} />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.RadioGroup
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <DropdownMenu.RadioItem value="latest">
                <Flex gap="2" align="center">
                  <Clock size={14} /> Latest
                </Flex>
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="alpha-asc">
                <Flex gap="2" align="center">
                  <ArrowDownAZ size={14} /> A → Z
                </Flex>
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="alpha-desc">
                <Flex gap="2" align="center">
                  <ArrowDownZA size={14} /> Z → A
                </Flex>
              </DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>

      {/* Activities list */}
      {displayActivities && displayActivities.length > 0 ? (
        <ul
          role="list"
          className="space-y-4 w-full max-w-full overflow-y-scroll"
        >
          {displayActivities.map((activity) => (
            <li
              key={activity._id}
              className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setSelectedActivity(activity)}
                className="block w-full min-w-0 text-left p-4 cursor-pointer"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2 wrap-break-word">
                  {activity.name}
                </h2>
                {activity.description && (
                  <p className="text-gray-600 mb-2 wrap-break-word line-clamp-3">
                    {activity.description}
                  </p>
                )}
                {activity.location && (
                  <p className="text-sm text-gray-500 mb-1 line-clamp-1">
                    📍 {activity.location.formattedAddress}
                  </p>
                )}
                {activity.tags && activity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activity.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 mt-8">
          {isSearchActive
            ? "No activities found for your search."
            : "No activities available."}
        </div>
      )}

      {/* Activity detail tray */}
      <Drawer.Root
        open={selectedActivity !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedActivity(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="bg-white h-fit max-h-[85vh] overflow-y-auto fixed bottom-0 left-0 right-0 outline-none rounded-t-2xl">
            <Theme>
              <Container className="p-6">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
                {selectedActivity && (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <Heading as="h2" size="6" className="flex-1" asChild>
                        <Drawer.Title>{selectedActivity.name}</Drawer.Title>
                      </Heading>
                      <Badge
                        size="2"
                        color={getUrgencyColor(selectedActivity.urgency)}
                      >
                        {selectedActivity.urgency.toUpperCase()}
                      </Badge>
                    </div>

                    {selectedActivity.description && (
                      <div className="max-h-[40vh] overflow-y-auto">
                        <Text size="4" color="gray">
                          {selectedActivity.description}
                        </Text>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedActivity.location && (
                        <div>
                          <Text size="2" weight="bold" color="gray">
                            Location
                          </Text>
                          <Text size="3" as="p">
                            📍{" "}
                            <a
                              href={
                                selectedActivity.location.latitude &&
                                selectedActivity.location.longitude
                                  ? `https://www.google.com/maps/search/?api=1&query=${selectedActivity.location.latitude},${selectedActivity.location.longitude}`
                                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedActivity.location.formattedAddress)}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {selectedActivity.location.formattedAddress}
                            </a>
                          </Text>
                        </div>
                      )}

                      {selectedActivity.startDate && (
                        <div>
                          <Text size="2" weight="bold" color="gray">
                            Start Date
                          </Text>
                          <Text size="3" as="p">
                            📅 {formatDate(selectedActivity.startDate)}
                          </Text>
                        </div>
                      )}

                      {selectedActivity.endDate && (
                        <div>
                          <Text size="2" weight="bold" color="gray">
                            End Date
                          </Text>
                          <Text size="3" as="p">
                            📅 {formatDate(selectedActivity.endDate)}
                            {(() => {
                              const days = getDaysUntilEnd(
                                selectedActivity.endDate,
                              );
                              if (days !== null) {
                                if (days === 0) return " (Today!)";
                                if (days === 1) return " (Tomorrow)";
                                if (days > 0) return ` (${days} days left)`;
                              }
                              return "";
                            })()}
                          </Text>
                        </div>
                      )}
                    </div>

                    {selectedActivity.tags &&
                      selectedActivity.tags.length > 0 && (
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
                            {selectedActivity.tags.map((tag, index) => (
                              <Badge key={index} size="1" color="blue">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedActivity.sourceUrl && (
                      <div className="pt-4 border-t border-gray-200">
                        <a
                          href={selectedActivity.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View source ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </Container>
            </Theme>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </Flex>
  );
}
