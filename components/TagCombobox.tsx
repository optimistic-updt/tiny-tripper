"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  TextField,
  Button,
  Flex,
  Badge,
  Box,
  Text,
  ScrollArea,
} from "@radix-ui/themes";
import { X, Plus } from "lucide-react";

interface TagComboboxProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagCombobox({
  value,
  onChange,
  placeholder = "Add tags...",
}: TagComboboxProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const createTag = useMutation(api.tags.createTag);
  const suggestions = useQuery(api.tags.listTags, {
    search: inputValue.trim() || undefined,
    limit: 10,
  });

  // Filter out already selected tags and limit suggestions
  const filteredSuggestions = suggestions?.filter(
    (tag) => !value.includes(tag.name)
  ) || [];

  // Check if the current input exactly matches an existing suggestion
  const exactMatch = filteredSuggestions.find(
    (tag) => tag.name.toLowerCase() === inputValue.toLowerCase()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = async (tagName: string) => {
    const trimmedName = tagName.trim();
    if (!trimmedName || value.includes(trimmedName)) return;

    // Create tag in database if it doesn't exist
    await createTag({ name: trimmedName });

    onChange([...value, trimmedName]);
    setInputValue("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex].name);
      } else if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        Math.min(prev + 1, filteredSuggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    setHighlightedIndex(-1);

    // Handle comma-separated input
    if (newValue.includes(",")) {
      const tags = newValue.split(",").map(tag => tag.trim()).filter(Boolean);
      const lastTag = tags.pop() || "";

      // Add all complete tags
      for (const tag of tags) {
        if (tag && !value.includes(tag)) {
          addTag(tag);
        }
      }

      setInputValue(lastTag);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <Box
        style={{
          border: "1px solid var(--gray-a7)",
          borderRadius: "var(--radius-2)",
          padding: "8px",
          minHeight: "40px",
          cursor: "text",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <Flex gap="1" wrap="wrap" align="center">
          {value.map((tag) => (
            <Badge key={tag} variant="soft" size="2">
              {tag}
              <Button
                variant="ghost"
                size="1"
                style={{ marginLeft: "4px", padding: "0", minWidth: "16px", height: "16px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
              >
                <X size={12} />
              </Button>
            </Badge>
          ))}
          <TextField.Root
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            style={{
              border: "none",
              outline: "none",
              flexGrow: 1,
              minWidth: "120px",
              backgroundColor: "transparent",
            }}
          />
        </Flex>
      </Box>

      {showSuggestions && (filteredSuggestions.length > 0 || (inputValue.trim() && !exactMatch)) && (
        <Box
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "var(--color-panel)",
            border: "1px solid var(--gray-a7)",
            borderRadius: "var(--radius-2)",
            boxShadow: "var(--shadow-4)",
            zIndex: 1000,
            maxHeight: "200px",
          }}
        >
          <ScrollArea>
            {filteredSuggestions.map((tag, index) => (
              <Box
                key={tag._id}
                p="2"
                style={{
                  cursor: "pointer",
                  backgroundColor: highlightedIndex === index ? "var(--accent-a3)" : "transparent",
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => addTag(tag.name)}
              >
                <Text size="2">{tag.name}</Text>
              </Box>
            ))}

            {inputValue.trim() && !exactMatch && (
              <Box
                p="2"
                style={{
                  cursor: "pointer",
                  backgroundColor: highlightedIndex === filteredSuggestions.length ? "var(--accent-a3)" : "transparent",
                  borderTop: filteredSuggestions.length > 0 ? "1px solid var(--gray-a5)" : "none",
                }}
                onMouseEnter={() => setHighlightedIndex(filteredSuggestions.length)}
                onClick={() => addTag(inputValue.trim())}
              >
                <Flex align="center" gap="2">
                  <Plus size={12} />
                  <Text size="2">Create &ldquo;{inputValue.trim()}&rdquo;</Text>
                </Flex>
              </Box>
            )}
          </ScrollArea>
        </Box>
      )}
    </div>
  );
}