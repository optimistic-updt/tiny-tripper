"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  Flex,
  Heading,
  Text,
  Box,
  Container,
} from "@radix-ui/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ROUTES } from "@/app/routes";
import { Thermometer } from "@/components/quiz/Thermometer";
import { Brain, Clock, Zap, ArrowRight } from "lucide-react";

// Insights based on score buckets
const INSIGHTS = {
  high: {
    title: "You're experiencing significant decision fatigue",
    description:
      "Your answers indicate that choosing activities is causing real stress. The good news? This is exactly what Tiny Tripper was built for.",
    recommendations: [
      {
        icon: Brain,
        title: "Decision Paralysis",
        tip: "You're overwhelmed by options. We'll narrow down to ONE perfect activity based on timing, location, and your kids' needs.",
      },
      {
        icon: Clock,
        title: "Time Recovery",
        tip: "You're spending too much time planning. Our recommendations are instant—no more 30+ minute research sessions.",
      },
      {
        icon: Zap,
        title: "Breaking Routines",
        tip: "Same playground every weekend? We'll introduce variety that matches your energy levels and schedule.",
      },
    ],
  },
  medium: {
    title: "You're managing, but there's room for improvement",
    description:
      "You've developed some coping strategies, but decision fatigue still affects your family time. Let us handle the planning.",
    recommendations: [
      {
        icon: Brain,
        title: "Reducing Mental Load",
        tip: "You sometimes struggle with too many options. We'll curate activities based on what actually matters to your family.",
      },
      {
        icon: Clock,
        title: "Saving Planning Time",
        tip: "You can cut your research time significantly. Open the app, get a recommendation, go.",
      },
      {
        icon: Zap,
        title: "Discovering New Activities",
        tip: "Break out of the routine with curated suggestions you might not have found otherwise.",
      },
    ],
  },
  low: {
    title: "You're doing great at managing activity planning!",
    description:
      "You've got solid systems in place. Tiny Tripper can still help you discover new activities and save time.",
    recommendations: [
      {
        icon: Brain,
        title: "Fresh Ideas",
        tip: "Even organized planners appreciate new suggestions. We track what's happening around Melbourne.",
      },
      {
        icon: Clock,
        title: "Instant Backup Plans",
        tip: "When Plan A falls through, we'll have Plan B ready instantly.",
      },
      {
        icon: Zap,
        title: "Hidden Gems",
        tip: "Discover activities you might not find through regular research—local events, seasonal opportunities, and more.",
      },
    ],
  },
};

export default function QuizResultsPage() {
  const searchParams = useSearchParams();
  const responseId = searchParams.get("id") as Id<"quizResponses"> | null;
  const posthog = usePostHog();

  const response = useQuery(
    api.quiz.getQuizResponse,
    responseId ? { responseId } : "skip"
  );

  useEffect(() => {
    if (response) {
      posthog?.capture("quiz_results_viewed", {
        score: response.totalScore,
        score_percentage: response.scorePercentage,
      });
    }
  }, [response, posthog]);

  if (!responseId) {
    return (
      <Container size="2" className="py-16">
        <Flex direction="column" align="center" gap="4">
          <Heading>Results not found</Heading>
          <Text color="gray">Please complete the quiz to see your results.</Text>
          <Link href="/quiz">
            <Button size="3">Take the Quiz</Button>
          </Link>
        </Flex>
      </Container>
    );
  }

  if (response === undefined) {
    return (
      <Container size="2" className="py-16">
        <Flex direction="column" align="center" gap="4">
          <Heading>Loading your results...</Heading>
        </Flex>
      </Container>
    );
  }

  if (response === null) {
    return (
      <Container size="2" className="py-16">
        <Flex direction="column" align="center" gap="4">
          <Heading>Results not found</Heading>
          <Link href="/quiz">
            <Button size="3">Take the Quiz</Button>
          </Link>
        </Flex>
      </Container>
    );
  }

  // Determine insight bucket
  const insightKey =
    response.scorePercentage >= 70
      ? "high"
      : response.scorePercentage >= 40
        ? "medium"
        : "low";
  const insights = INSIGHTS[insightKey];

  return (
    <Container size="2" className="py-8 px-4">
      <Flex direction="column" align="center" gap="8">
        {/* Personalized greeting */}
        <Heading size="6" align="center">
          {response.name}, here are your results
        </Heading>

        {/* Thermometer visualization */}
        <Thermometer percentage={response.scorePercentage} />

        {/* The Big Reveal */}
        <Card size="3" className="w-full max-w-lg">
          <Flex direction="column" gap="3" p="4">
            <Heading size="4">{insights.title}</Heading>
            <Text color="gray">{insights.description}</Text>
          </Flex>
        </Card>

        {/* 3 Insights */}
        <Flex direction="column" gap="4" className="w-full max-w-lg">
          <Heading size="4" align="center">
            Your Personalized Insights
          </Heading>

          {insights.recommendations.map((rec, index) => {
            const IconComponent = rec.icon;
            return (
              <Card key={index} size="2">
                <Flex gap="4" p="3" align="start">
                  <Box className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-orange-600" />
                  </Box>
                  <Flex direction="column" gap="1">
                    <Text weight="medium">{rec.title}</Text>
                    <Text size="2" color="gray">
                      {rec.tip}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Flex>

        {/* CTA */}
        <Flex
          direction="column"
          align="center"
          gap="4"
          className="w-full max-w-lg"
        >
          <Heading size="5" align="center">
            Ready to reclaim your weekends?
          </Heading>
          <Text align="center" color="gray">
            Get your first personalized activity recommendation now.
          </Text>

          <Link href={ROUTES.play}>
            <Button size="4" variant="solid">
              Get My First Recommendation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Flex>

        {/* Footer */}
        <Box className="w-full border-t pt-6 mt-6">
          <Flex justify="center" gap="4">
            <Link href={ROUTES.home}>
              <Text size="2" color="gray">
                Back to Home
              </Text>
            </Link>
            <Link href={ROUTES.privacyPolicy}>
              <Text size="2" color="gray">
                Privacy Policy
              </Text>
            </Link>
          </Flex>
        </Box>
      </Flex>
    </Container>
  );
}
