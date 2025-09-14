"use client";

// import Link from "next/link";
// import { ROUTES } from "@/app/routes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Flex } from "@radix-ui/themes";
// import { SearchBar } from "@/components/SearchBar";

// type Activity = {
//   _id: string;
//   name: string;
//   description?: string;
//   location?: string;
//   tags?: string[];
//   urgency?: "low" | "medium" | "high";
//   endDate?: string;
//   isPublic?: boolean;
//   userId?: string;
//   _score?: number;
// };

export default function ActivitiesPage() {
  const allActivities = useQuery(api.activities.listActivities);
  // const [searchResults, setSearchResults] = useState<Activity[]>([]);
  // const [isSearchActive, setIsSearchActive] = useState(false);

  const isLoading = false;

  // const handleSearchResults = (results: Activity[]) => {
  //   setSearchResults(results);
  //   setIsSearchActive(results.length > 0 || true); // Show search results even if empty to indicate search was performed
  // };

  const displayActivities = allActivities;

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
      {/* <SearchBar onSearchResults={handleSearchResults} /> */}

      {isLoading && <p>Loading activities...</p>}

      {/* Activities list */}
      {displayActivities && displayActivities.length > 0 ? (
        <ul role="list" className="space-y-4">
          {displayActivities.map((activity) => (
            <li
              key={activity._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* link */}
              <div
                // href={ROUTES.build.activity(String(activity._id))}
                className="block"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {activity.name}
                </h2>
                {activity.description && (
                  <p className="text-gray-600 mb-2">{activity.description}</p>
                )}
                {activity.location && (
                  <p className="text-sm text-gray-500 mb-1">
                    📍 {activity.location}
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
          No activities available.
          {/*  {isSearchActive
       90 -                ? "No activities found for your search."
       91 -                : "No activities available."} */}
        </div>
      )}
    </Flex>
  );
}
