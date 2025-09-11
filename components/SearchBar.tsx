"use client";

import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

type Activity = {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  tags?: string[];
  urgency?: "low" | "medium" | "high";
  endDate?: string;
  isPublic?: boolean;
  userId?: string;
  _score?: number;
};

interface SearchBarProps {
  onSearchResults: (results: Activity[]) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearchResults,
  placeholder = "Search activities...",
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const searchActivities = useAction(api.activities.searchActivities);

  const handleSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        // onSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchActivities({ searchTerm: term });

        onSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        // onSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchActivities, onSearchResults],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);

      // Debounce search
      const timeoutId = setTimeout(() => {
        handleSearch(value);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [handleSearch],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSearch(searchTerm);
    },
    [handleSearch, searchTerm],
  );

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          disabled={isSearching}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </form>
    </div>
  );
}
