"use client";

import { Button, Flex, Heading, Text, RadioCards } from "@radix-ui/themes";
import { useState } from "react";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface SelectQuestionProps {
  question: string;
  description?: string;
  options: Option[];
  onAnswer: (value: string) => void;
}

export function SelectQuestion({
  question,
  description,
  options,
  onAnswer,
}: SelectQuestionProps) {
  const [selected, setSelected] = useState<string>("");

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

      <RadioCards.Root
        value={selected}
        onValueChange={setSelected}
        className="w-full"
      >
        <Flex direction="column" gap="2" width="100%">
          {options.map((option) => (
            <RadioCards.Item key={option.value} value={option.value}>
              <Flex direction="column" gap="1">
                <Text weight="medium">{option.label}</Text>
                {option.description && (
                  <Text size="1" color="gray">
                    {option.description}
                  </Text>
                )}
              </Flex>
            </RadioCards.Item>
          ))}
        </Flex>
      </RadioCards.Root>

      <Button
        size="4"
        variant="solid"
        onClick={() => onAnswer(selected)}
        disabled={!selected}
      >
        Continue
      </Button>
    </Flex>
  );
}
