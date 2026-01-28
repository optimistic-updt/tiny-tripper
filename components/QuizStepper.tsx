"use client";

import { Flex, Text, Box } from "@radix-ui/themes";

interface QuizStepperProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function QuizStepper({
  currentStep,
  totalSteps,
  stepLabels,
}: QuizStepperProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <Flex direction="column" gap="2" width="100%" mb="6">
      <Flex justify="between" align="center">
        <Text size="2" color="gray">
          Question {currentStep} of {totalSteps}
        </Text>
        <Text size="2" color="gray">
          {progress}% complete
        </Text>
      </Flex>

      {/* Progress bar */}
      <Box className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <Box
          className="h-full bg-orange-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </Box>

      {stepLabels && stepLabels[currentStep - 1] && (
        <Text size="1" color="gray" align="center">
          {stepLabels[currentStep - 1]}
        </Text>
      )}
    </Flex>
  );
}
