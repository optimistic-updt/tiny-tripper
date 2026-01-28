"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@radix-ui/themes";

interface ThermometerProps {
  percentage: number; // 0-100
  label?: string;
}

export function Thermometer({ percentage, label }: ThermometerProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Animate the fill on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage]);

  // Determine color based on percentage (higher = more decision fatigue = "warmer")
  const getColor = (pct: number) => {
    if (pct >= 70)
      return {
        bg: "bg-red-500",
        text: "text-red-600",
        label: "High Decision Fatigue",
      };
    if (pct >= 40)
      return {
        bg: "bg-orange-500",
        text: "text-orange-600",
        label: "Moderate Decision Fatigue",
      };
    return {
      bg: "bg-green-500",
      text: "text-green-600",
      label: "Low Decision Fatigue",
    };
  };

  const colorInfo = getColor(percentage);

  return (
    <Flex direction="column" align="center" gap="4" className="w-full max-w-xs">
      {/* Thermometer container */}
      <Box className="relative w-20 h-64">
        {/* Thermometer outline */}
        <Box className="absolute inset-0 bg-gray-100 rounded-full border-4 border-gray-300 overflow-hidden">
          {/* Fill */}
          <Box
            className={`absolute bottom-0 left-0 right-0 ${colorInfo.bg} transition-all duration-1000 ease-out rounded-b-full`}
            style={{ height: `${animatedPercentage}%` }}
          />

          {/* Graduation marks */}
          <Flex
            direction="column"
            justify="between"
            className="absolute inset-2 pointer-events-none"
          >
            {[100, 75, 50, 25, 0].map((mark) => (
              <Flex key={mark} align="center" gap="2">
                <Box className="w-2 h-0.5 bg-gray-400" />
                <Text size="1" color="gray">
                  {mark}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>

        {/* Bulb at bottom */}
        <Box
          className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 ${colorInfo.bg} rounded-full border-4 border-gray-300 flex items-center justify-center transition-colors duration-1000`}
        >
          <Text size="2" weight="bold" className="text-white">
            {Math.round(animatedPercentage)}
          </Text>
        </Box>
      </Box>

      {/* Label */}
      <Flex direction="column" align="center" gap="1" className="mt-4">
        <Text size="5" weight="bold" className={colorInfo.text}>
          {animatedPercentage}% Decision Fatigue
        </Text>
        <Text size="2" color="gray">
          {label || colorInfo.label}
        </Text>
      </Flex>
    </Flex>
  );
}
