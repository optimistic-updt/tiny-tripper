"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Flex, Spinner, Text } from "@radix-ui/themes";
import { SearchBar } from "@/components/SearchBar";

export default function ActivitiesPage() {
  const allActivities = useQuery(api.activities.listActivities);
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

  // Show loading state while data is being fetched
  if (allActivities === undefined) {
    return (
      <Flex direction="column" align="center" justify="center" height="100%" p="5">
        <Spinner size="3" />
        <Text size="4" color="gray" mt="4">Loading activities...</Text>
      </Flex>
    );
  }

  const displayActivities = isSearchActive ? searchResults : allActivities;

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
      <SearchBar
        onSearchResults={handleSearchResults}
        onSearchCleared={handleSearchCleared}
      />

      {/* Activities list */}
      {displayActivities && displayActivities.length > 0 ? (
        <ul role="list" className="space-y-4">
          {displayActivities.map((activity) => (
            <li
              key={activity._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="block">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {activity.name}
                </h2>
                {activity.description && (
                  <p className="text-gray-600 mb-2">{activity.description}</p>
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
