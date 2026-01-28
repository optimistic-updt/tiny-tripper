"use client";

import { useState } from "react";
import { Button, Flex, Heading, Text, TextArea, TextField } from "@radix-ui/themes";

interface TextQuestionProps {
  question: string;
  description?: string;
  placeholder?: string;
  onAnswer: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}

export function TextQuestion({
  question,
  description,
  placeholder,
  onAnswer,
  multiline = false,
  required = true,
}: TextQuestionProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (required && !value.trim()) return;
    onAnswer(value);
  };

  return (
    <Flex direction="column" align="center" gap="6" className="w-full max-w-md">
      <Heading as="h2" size="5" align="center">
        {question}
      </Heading>

      {description && (
        <Text size="2" color="gray" align="center">
          {description}
        </Text>
      )}

      {multiline ? (
        <TextArea
          size="3"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full min-h-[120px]"
        />
      ) : (
        <TextField.Root
          size="3"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full"
        />
      )}

      <Button
        size="4"
        variant="solid"
        onClick={handleSubmit}
        disabled={required && !value.trim()}
      >
        Continue
      </Button>

      {!required && (
        <Button size="3" variant="ghost" onClick={() => onAnswer("")}>
          Skip
        </Button>
      )}
    </Flex>
  );
}
