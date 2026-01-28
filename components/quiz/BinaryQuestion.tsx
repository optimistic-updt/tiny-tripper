"use client";

import { Button, Flex, Heading, Text } from "@radix-ui/themes";

interface BinaryQuestionProps {
  question: string;
  description?: string;
  onAnswer: (value: number) => void;
  yesLabel?: string;
  noLabel?: string;
}

export function BinaryQuestion({
  question,
  description,
  onAnswer,
  yesLabel = "Yes, often",
  noLabel = "No, rarely",
}: BinaryQuestionProps) {
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

      <Flex gap="4" width="100%">
        <Button
          size="4"
          variant="outline"
          className="flex-1"
          onClick={() => onAnswer(0)}
        >
          {noLabel}
        </Button>
        <Button
          size="4"
          variant="solid"
          className="flex-1"
          onClick={() => onAnswer(1)}
        >
          {yesLabel}
        </Button>
      </Flex>
    </Flex>
  );
}
