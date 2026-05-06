"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  Flex,
  IconButton,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { ArrowDownAZ, ArrowDownZA, Clock } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";

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
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="block min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-2 wrap-break-word">
                  {activity.name}
                </h2>
                {activity.description && (
                  <p className="text-gray-600 mb-2 wrap-break-word">
                    {activity.description}
                  </p>
                )}
                {activity.location && (
                  <p className="text-sm text-gray-500 mb-1">
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
              </div>
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
    </Flex>
  );
}
