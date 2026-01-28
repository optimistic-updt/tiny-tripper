"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Heading,
  Text,
  Container,
  Flex,
  Card,
  Box,
  Badge,
} from "@radix-ui/themes";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { ROUTES } from "./routes";
import { Brain, Clock, Zap } from "lucide-react";

export default function Home() {
  const posthog = usePostHog();
  const [headlineVariant, setHeadlineVariant] = useState<
    "frustration" | "results"
  >("frustration");

  useEffect(() => {
    // Get A/B test variant from PostHog
    if (posthog) {
      const variant = posthog.getFeatureFlag("landing-headline-test");
      if (variant === "results") {
        setHeadlineVariant("results");
      }
      // Track page view with variant
      posthog.capture("landing_page_viewed", {
        headline_variant: variant || "frustration",
      });
    }
  }, [posthog]);

  const headlines = {
    frustration: {
      title:
        "Feeling frustrated that weekends slip away without quality family time?",
      subtitle:
        "Answer 15 questions to discover why decision fatigue is stealing your adventures—and what to do about it.",
    },
    results: {
      title: "Ready to spend less time planning and more time playing?",
      subtitle:
        "Answer 15 questions to unlock personalized activity recommendations that match your family's energy.",
    },
  };

  const currentHeadline = headlines[headlineVariant];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="px-6 pt-16 pb-12 lg:px-8">
        <Container size="3">
          <Flex direction="column" align="center" gap="6">
            <Badge size="2" color="orange">
              For Melbourne Parents
            </Badge>

            <Heading as="h1" size="8" align="center" className="max-w-3xl">
              {currentHeadline.title}
            </Heading>

            <Text size="4" align="center" color="gray" className="max-w-2xl">
              {currentHeadline.subtitle}
            </Text>

            {/* Dual CTA */}
            <Flex gap="4" mt="4" wrap="wrap" justify="center">
              <Link href="/quiz">
                <Button size="4" variant="solid">
                  Start the Quiz
                </Button>
              </Link>
              <Link href={ROUTES.play}>
                <Button size="4" variant="outline">
                  Try it Now
                </Button>
              </Link>
            </Flex>

            {/* Micro-copy assurances */}
            <Flex gap="4" wrap="wrap" justify="center">
              <Text size="2" color="gray">
                Takes 3 minutes
              </Text>
              <Text size="2" color="gray">
                Completely Free
              </Text>
              <Text size="2" color="gray">
                Immediate Recommendations
              </Text>
            </Flex>
          </Flex>
        </Container>
      </section>

      {/* Value Proposition - 3 Pain Points */}
      <section className="px-6 py-16 lg:px-8 bg-[var(--gray-2)]">
        <Container size="3">
          <Heading as="h2" size="6" align="center" mb="6">
            We&apos;ll help you overcome:
          </Heading>

          <Flex gap="4" wrap="wrap" justify="center">
            <Card size="3" className="max-w-xs">
              <Flex direction="column" align="center" gap="3" p="4">
                <Box className="p-3 bg-orange-100 rounded-full">
                  <Brain className="w-6 h-6 text-orange-600" />
                </Box>
                <Heading as="h3" size="4">
                  Decision Paralysis
                </Heading>
                <Text size="2" align="center" color="gray">
                  Too many options leading to analysis paralysis—and ending up
                  doing nothing.
                </Text>
              </Flex>
            </Card>

            <Card size="3" className="max-w-xs">
              <Flex direction="column" align="center" gap="3" p="4">
                <Box className="p-3 bg-orange-100 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </Box>
                <Heading as="h3" size="4">
                  Planning Overload
                </Heading>
                <Text size="2" align="center" color="gray">
                  Spending more time researching activities than actually
                  enjoying them.
                </Text>
              </Flex>
            </Card>

            <Card size="3" className="max-w-xs">
              <Flex direction="column" align="center" gap="3" p="4">
                <Box className="p-3 bg-orange-100 rounded-full">
                  <Zap className="w-6 h-6 text-orange-600" />
                </Box>
                <Heading as="h3" size="4">
                  Repetitive Routines
                </Heading>
                <Text size="2" align="center" color="gray">
                  Defaulting to the same activities because trying new things
                  feels exhausting.
                </Text>
              </Flex>
            </Card>
          </Flex>
        </Container>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="px-6 py-16 lg:px-8">
        <Container size="2">
          <Card size="3">
            <Flex direction="column" align="center" gap="4" p="6">
              <Heading as="h2" size="5" align="center">
                You&apos;re not alone
              </Heading>

              <Flex gap="8" wrap="wrap" justify="center">
                <Flex direction="column" align="center">
                  <Text size="8" weight="bold" color="orange">
                    73%
                  </Text>
                  <Text size="2" color="gray" align="center">
                    of parents feel overwhelmed
                    <br />
                    by activity choices
                  </Text>
                </Flex>

                <Flex direction="column" align="center">
                  <Text size="8" weight="bold" color="orange">
                    2.5hrs
                  </Text>
                  <Text size="2" color="gray" align="center">
                    average weekly time
                    <br />
                    spent planning activities
                  </Text>
                </Flex>

                <Flex direction="column" align="center">
                  <Text size="8" weight="bold" color="orange">
                    4/10
                  </Text>
                  <Text size="2" color="gray" align="center">
                    planned outings get
                    <br />
                    cancelled due to indecision
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Card>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 lg:px-8">
        <Container size="2">
          <Flex direction="column" align="center" gap="6">
            <Heading as="h2" size="6" align="center">
              Ready to reclaim your weekends?
            </Heading>

            <Link href="/quiz">
              <Button size="4" variant="solid">
                Start the Quiz
              </Button>
            </Link>
          </Flex>
        </Container>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 lg:px-8 border-t">
        <Container size="3">
          <Flex justify="between" align="center" wrap="wrap" gap="4">
            <Text size="2" color="gray">
              © 2026 Tiny Tripper
            </Text>
            <Flex gap="4">
              <Link href={ROUTES.privacyPolicy}>
                <Text size="2" color="gray">
                  Privacy Policy
                </Text>
              </Link>
            </Flex>
          </Flex>
        </Container>
      </footer>
    </main>
  );
}
