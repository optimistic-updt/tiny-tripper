# Landing Page Quiz Funnel Implementation Plan

## Overview

Build a conversion-optimized landing page with a 15-question quiz funnel for Tiny Tripper. The funnel serves dual purposes: (1) capture leads with email collection and user segmentation, and (2) personalize the app experience by understanding parent pain points around decision fatigue when planning kids activities.

The quiz is **optional** - users can still use the existing "Try it Now" quick path to `/tt/play`.

## Current State Analysis

**Existing Landing Page** (`app/page.tsx`):
- Minimal hero section with "Remove the Decision Fatigue 😩" heading
- Single CTA "Try it Now" linking to `/tt/play`
- No email capture, quiz, or lead generation
- Commented-out gradient decorations and background image

**Tech Stack Available**:
- Next.js 15 with App Router
- Radix UI Themes + Tailwind CSS 4
- Convex backend (real-time database)
- Clerk authentication (anonymous-first approach)
- PostHog analytics (will use for A/B testing)
- React Hook Form for form handling

**Key Discoveries**:
- No existing multi-step form or stepper components
- `TagCombobox.tsx` and `GooglePlacesAutocomplete.tsx` show form patterns
- Custom 3D button styling exists in `app/tt/play/3d_button.module.css`
- PostHog already initialized in `PostHogProvider.tsx`

## Desired End State

After implementation:

1. **Landing Page** at `/` displays:
   - A/B tested hero headlines via PostHog feature flags
   - 3 value proposition cards about pain points (Decision Paralysis focus)
   - Anonymous social proof stats section
   - Two CTAs: "Start the Quiz" (primary) and "Try it Now" (secondary)

2. **Quiz Flow** at `/quiz`:
   - Step 1: Contact capture (name, email, optional phone, location detection)
   - Steps 2-11: 10 scoring questions (binary/frequency) about decision fatigue
   - Steps 12-16: 5 qualifying questions (situation, goals, obstacles, budget, open text)
   - Progress indicator throughout

3. **Results Page** at `/quiz/results`:
   - Playful thermometer visualization of score
   - Personalized insights based on 3 pain point categories
   - Smart CTA routing to `/tt/play` with personalized message
   - Social links and footer

4. **Data Model**:
   - New `quizResponses` table in Convex storing all responses
   - PostHog events for funnel analytics

**Verification**:
- Complete quiz flow works end-to-end
- A/B test variants display correctly based on PostHog flag
- Quiz responses persist in Convex
- Score calculation produces meaningful results
- Thermometer animation renders smoothly

## What We're NOT Doing

- **Premium service tiers**: All users route to the free app, no paid booking/workshops
- **Clerk account creation**: Anonymous-first, email captured but no mandatory signup
- **Complex geolocation**: Simple IP-based city detection, not precise coordinates
- **Multiple result CTAs**: Single path to `/tt/play` (not calendar booking, workshops, etc.)
- **Real testimonials**: Using generic stats, not specific user stories
- **Mobile app changes**: Quiz is web-only, no native app modifications

## Implementation Approach

Build in 5 phases:
1. **Data model & backend** - Convex schema and mutations
2. **Landing page redesign** - New hero, value props, credibility, CTAs
3. **Quiz components** - Multi-step form with stepper
4. **Results page** - Score calculation, thermometer, insights
5. **A/B testing & analytics** - PostHog integration

---

## Phase 1: Data Model & Backend

### Overview
Create the Convex schema and backend functions to store quiz responses and calculate scores.

### Changes Required:

#### 1. Schema Extension

**File**: `convex/schema.ts`
**Changes**: Add `quizResponses` table

```typescript
// Add after existing tables (line ~80)

quizResponses: defineTable({
  // Contact info (Step 1)
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  detectedCity: v.optional(v.string()),
  detectedCountry: v.optional(v.string()),

  // Scoring questions (Q1-Q10) - each is 0 or 1 point
  q1_overwhelmed_options: v.number(), // "Do you often feel overwhelmed by the number of activity options?"
  q2_end_up_home: v.number(), // "Do you frequently end up staying home because you couldn't decide?"
  q3_same_activities: v.number(), // "Do you find yourself doing the same activities repeatedly?"
  q4_research_time: v.number(), // "Do you spend more than 30 minutes researching what to do?"
  q5_weather_ruins: v.number(), // "Does unexpected weather often ruin your plans?"
  q6_energy_after_work: v.number(), // "Is finding energy after work/weekdays a challenge?"
  q7_partner_disagree: v.number(), // "Do you and your partner disagree on activity choices?"
  q8_kids_bored: v.number(), // "Do your kids get bored with activities quickly?"
  q9_last_minute: v.number(), // "Do you often plan activities at the last minute?"
  q10_guilt_screen_time: v.number(), // "Do you feel guilty when kids have too much screen time?"

  // Calculated score (0-10)
  totalScore: v.number(),
  scorePercentage: v.number(), // 0-100

  // Qualifying questions (Q11-Q15)
  q11_situation: v.string(), // "Student" | "Working Parent" | "Stay-at-Home Parent" | "Carer"
  q12_desired_outcome: v.string(), // Free text: 90-day goal
  q13_obstacles: v.string(), // Free text: What's stopping you
  q14_budget_indicator: v.string(), // "DIY" | "Guided" | "Premium" | "Whatever works"
  q15_anything_else: v.optional(v.string()), // Optional free text

  // Metadata
  completedAt: v.number(),
  userId: v.optional(v.string()), // Clerk user ID if logged in
  abTestVariant: v.optional(v.string()), // Which headline they saw
  referrer: v.optional(v.string()),
  userAgent: v.optional(v.string()),
})
  .index("by_email", ["email"])
  .index("by_completedAt", ["completedAt"])
  .index("by_userId", ["userId"]),
```

#### 2. Quiz Backend Functions

**File**: `convex/quiz.ts` (new file)
**Changes**: Create mutations and queries for quiz

```typescript
"use node";

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Submit completed quiz
export const submitQuizResponse = mutation({
  args: {
    // Contact
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    detectedCity: v.optional(v.string()),
    detectedCountry: v.optional(v.string()),

    // Scoring answers (0 or 1 each)
    q1_overwhelmed_options: v.number(),
    q2_end_up_home: v.number(),
    q3_same_activities: v.number(),
    q4_research_time: v.number(),
    q5_weather_ruins: v.number(),
    q6_energy_after_work: v.number(),
    q7_partner_disagree: v.number(),
    q8_kids_bored: v.number(),
    q9_last_minute: v.number(),
    q10_guilt_screen_time: v.number(),

    // Qualifying
    q11_situation: v.string(),
    q12_desired_outcome: v.string(),
    q13_obstacles: v.string(),
    q14_budget_indicator: v.string(),
    q15_anything_else: v.optional(v.string()),

    // Metadata
    abTestVariant: v.optional(v.string()),
    referrer: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.object({
    responseId: v.id("quizResponses"),
    totalScore: v.number(),
    scorePercentage: v.number(),
  }),
  handler: async (ctx, args) => {
    // Calculate score
    const totalScore =
      args.q1_overwhelmed_options +
      args.q2_end_up_home +
      args.q3_same_activities +
      args.q4_research_time +
      args.q5_weather_ruins +
      args.q6_energy_after_work +
      args.q7_partner_disagree +
      args.q8_kids_bored +
      args.q9_last_minute +
      args.q10_guilt_screen_time;

    const scorePercentage = Math.round((totalScore / 10) * 100);

    // Get user if authenticated
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const responseId = await ctx.db.insert("quizResponses", {
      ...args,
      totalScore,
      scorePercentage,
      completedAt: Date.now(),
      userId,
    });

    return { responseId, totalScore, scorePercentage };
  },
});

// Get quiz response by ID (for results page)
export const getQuizResponse = query({
  args: { responseId: v.id("quizResponses") },
  returns: v.union(
    v.object({
      _id: v.id("quizResponses"),
      name: v.string(),
      totalScore: v.number(),
      scorePercentage: v.number(),
      q11_situation: v.string(),
      q12_desired_outcome: v.string(),
      q14_budget_indicator: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const response = await ctx.db.get(args.responseId);
    if (!response) return null;

    return {
      _id: response._id,
      name: response.name,
      totalScore: response.totalScore,
      scorePercentage: response.scorePercentage,
      q11_situation: response.q11_situation,
      q12_desired_outcome: response.q12_desired_outcome,
      q14_budget_indicator: response.q14_budget_indicator,
    };
  },
});

// Check if email already exists (for soft validation)
export const checkEmailExists = query({
  args: { email: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("quizResponses")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return !!existing;
  },
});
```

### Success Criteria:

#### Automated Verification:
- [x] Schema types generate correctly: `pnpm convex dev` runs without errors
- [x] TypeScript compiles: `pnpm tsc --noEmit`
- [x] Linting passes: `pnpm lint`

#### Manual Verification:
- [ ] Can insert a test quiz response via Convex dashboard
- [ ] Score calculation produces expected results (10 "yes" answers = 100%)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Landing Page Redesign

### Overview
Transform the minimal landing page into a conversion-optimized page with A/B tested headlines, value propositions, and dual CTAs.

### Changes Required:

#### 1. Landing Page Structure

**File**: `app/page.tsx`
**Changes**: Complete redesign with new sections

```typescript
"use client";

import { useEffect, useState } from "react";
import { Button, Heading, Text, Container, Flex, Card, Box, Badge } from "@radix-ui/themes";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { ROUTES } from "./routes";
import { Brain, Clock, Zap } from "lucide-react";

export default function Home() {
  const posthog = usePostHog();
  const [headlineVariant, setHeadlineVariant] = useState<"frustration" | "results">("frustration");

  useEffect(() => {
    // Get A/B test variant from PostHog
    if (posthog) {
      const variant = posthog.getFeatureFlag("landing-headline-test");
      if (variant === "results") {
        setHeadlineVariant("results");
      }
      // Track page view with variant
      posthog.capture("landing_page_viewed", { headline_variant: variant || "frustration" });
    }
  }, [posthog]);

  const headlines = {
    frustration: {
      title: "Feeling frustrated that weekends slip away without quality family time?",
      subtitle: "Answer 15 questions to discover why decision fatigue is stealing your adventures—and what to do about it.",
    },
    results: {
      title: "Ready to spend less time planning and more time playing?",
      subtitle: "Answer 15 questions to unlock personalized activity recommendations that match your family's energy.",
    },
  };

  const currentHeadline = headlines[headlineVariant];

  return (
    <main className="min-h-screen background-app-light dark:background-app-dark">
      {/* Hero Section */}
      <section className="px-6 pt-16 pb-12 lg:px-8">
        <Container size="3">
          <Flex direction="column" align="center" gap="6">
            <Badge size="2" color="orange">For Melbourne Parents</Badge>

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
                  Try it Now →
                </Button>
              </Link>
            </Flex>

            {/* Micro-copy assurances */}
            <Flex gap="4" wrap="wrap" justify="center">
              <Text size="2" color="gray">⏱️ Takes 3 minutes</Text>
              <Text size="2" color="gray">✓ Completely Free</Text>
              <Text size="2" color="gray">🎯 Immediate Recommendations</Text>
            </Flex>
          </Flex>
        </Container>
      </section>

      {/* Value Proposition - 3 Pain Points */}
      <section className="px-6 py-16 lg:px-8 bg-white/50">
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
                <Heading as="h3" size="4">Decision Paralysis</Heading>
                <Text size="2" align="center" color="gray">
                  Too many options leading to analysis paralysis—and ending up doing nothing.
                </Text>
              </Flex>
            </Card>

            <Card size="3" className="max-w-xs">
              <Flex direction="column" align="center" gap="3" p="4">
                <Box className="p-3 bg-orange-100 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </Box>
                <Heading as="h3" size="4">Planning Overload</Heading>
                <Text size="2" align="center" color="gray">
                  Spending more time researching activities than actually enjoying them.
                </Text>
              </Flex>
            </Card>

            <Card size="3" className="max-w-xs">
              <Flex direction="column" align="center" gap="3" p="4">
                <Box className="p-3 bg-orange-100 rounded-full">
                  <Zap className="w-6 h-6 text-orange-600" />
                </Box>
                <Heading as="h3" size="4">Repetitive Routines</Heading>
                <Text size="2" align="center" color="gray">
                  Defaulting to the same activities because trying new things feels exhausting.
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
                  <Text size="8" weight="bold" color="orange">73%</Text>
                  <Text size="2" color="gray" align="center">of parents feel overwhelmed<br/>by activity choices</Text>
                </Flex>

                <Flex direction="column" align="center">
                  <Text size="8" weight="bold" color="orange">2.5hrs</Text>
                  <Text size="2" color="gray" align="center">average weekly time<br/>spent planning activities</Text>
                </Flex>

                <Flex direction="column" align="center">
                  <Text size="8" weight="bold" color="orange">4/10</Text>
                  <Text size="2" color="gray" align="center">planned outings get<br/>cancelled due to indecision</Text>
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
            <Text size="2" color="gray">© 2026 Tiny Tripper</Text>
            <Flex gap="4">
              <Link href={ROUTES.privacyPolicy}>
                <Text size="2" color="gray">Privacy Policy</Text>
              </Link>
            </Flex>
          </Flex>
        </Container>
      </footer>
    </main>
  );
}
```

#### 2. Routes Update

**File**: `app/routes.tsx`
**Changes**: Add quiz routes

```typescript
export const ROUTES = {
  // public
  home: "/",
  privacyPolicy: "/privacy",
  quiz: "/quiz",
  quizResults: "/quiz/results",
  // app
  activities: "/tt/activities",
  play: "/tt/play",
  newActivity: "/tt/create",
  build: {
    activity: (id: string) => `/tt/activities/${id}`,
    quizResults: (responseId: string) => `/quiz/results?id=${responseId}`,
  },
};
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `pnpm tsc --noEmit`
- [x] Linting passes: `pnpm lint`
- [x] Build succeeds: `pnpm build`

#### Manual Verification:
- [ ] Landing page renders with all sections visible
- [ ] Both CTAs work (quiz link and "Try it Now")
- [ ] Page is mobile responsive
- [ ] Stats section displays correctly

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 3.

---

## Phase 3: Quiz Components & Flow

### Overview
Build the multi-step quiz interface with progress indicator, contact capture, scoring questions, and qualifying questions.

### Changes Required:

#### 1. Quiz Page Layout

**File**: `app/quiz/layout.tsx` (new file)

```typescript
import { Container, Flex } from "@radix-ui/themes";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen background-app-light dark:background-app-dark">
      <Container size="2" className="py-8 px-4">
        <Flex direction="column" align="center" minHeight="100vh">
          {children}
        </Flex>
      </Container>
    </div>
  );
}
```

#### 2. Quiz Stepper Component

**File**: `components/QuizStepper.tsx` (new file)

```typescript
"use client";

import { Flex, Text, Box } from "@radix-ui/themes";

interface QuizStepperProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function QuizStepper({ currentStep, totalSteps, stepLabels }: QuizStepperProps) {
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
```

#### 3. Quiz Question Components

**File**: `components/quiz/BinaryQuestion.tsx` (new file)

```typescript
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
```

**File**: `components/quiz/TextQuestion.tsx` (new file)

```typescript
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
        <Button
          size="3"
          variant="ghost"
          onClick={() => onAnswer("")}
        >
          Skip
        </Button>
      )}
    </Flex>
  );
}
```

**File**: `components/quiz/SelectQuestion.tsx` (new file)

```typescript
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
                  <Text size="1" color="gray">{option.description}</Text>
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
```

#### 4. Contact Capture Step

**File**: `components/quiz/ContactCapture.tsx` (new file)

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button, Flex, Heading, Text, TextField, Box } from "@radix-ui/themes";
import { useForm } from "react-hook-form";

interface ContactData {
  name: string;
  email: string;
  phone?: string;
  detectedCity?: string;
  detectedCountry?: string;
}

interface ContactCaptureProps {
  onSubmit: (data: ContactData) => void;
}

export function ContactCapture({ onSubmit }: ContactCaptureProps) {
  const [locationDetected, setLocationDetected] = useState<{city?: string; country?: string}>({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ContactData>({
    mode: "onChange",
  });

  // IP-based geolocation detection
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        setLocationDetected({
          city: data.city,
          country: data.country_name,
        });
      } catch (error) {
        console.error("Location detection failed:", error);
      } finally {
        setIsDetectingLocation(false);
      }
    };

    detectLocation();
  }, []);

  const onFormSubmit = (data: ContactData) => {
    onSubmit({
      ...data,
      detectedCity: locationDetected.city,
      detectedCountry: locationDetected.country,
    });
  };

  return (
    <Flex direction="column" align="center" gap="6" className="w-full max-w-md">
      <Heading as="h2" size="5" align="center">
        Let&apos;s get started!
      </Heading>

      <Text size="2" color="gray" align="center">
        We&apos;ll send your personalized results to your email.
      </Text>

      {locationDetected.city && (
        <Box className="p-3 bg-green-50 rounded-lg w-full">
          <Text size="2" color="green">
            📍 Detected location: {locationDetected.city}, {locationDetected.country}
          </Text>
        </Box>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
        <Flex direction="column" gap="4">
          <Box>
            <Text as="label" size="2" weight="medium">
              Your name *
            </Text>
            <TextField.Root
              size="3"
              placeholder="Jane"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <Text size="1" color="red">{errors.name.message}</Text>
            )}
          </Box>

          <Box>
            <Text as="label" size="2" weight="medium">
              Email address *
            </Text>
            <TextField.Root
              size="3"
              type="email"
              placeholder="jane@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <Text size="1" color="red">{errors.email.message}</Text>
            )}
          </Box>

          <Box>
            <Text as="label" size="2" weight="medium">
              Phone number (optional)
            </Text>
            <TextField.Root
              size="3"
              type="tel"
              placeholder="+61 4XX XXX XXX"
              {...register("phone")}
            />
          </Box>

          <Button
            type="submit"
            size="4"
            variant="solid"
            disabled={!isValid || isDetectingLocation}
          >
            {isDetectingLocation ? "Detecting location..." : "Continue to Quiz"}
          </Button>
        </Flex>
      </form>
    </Flex>
  );
}
```

#### 5. Main Quiz Page

**File**: `app/quiz/page.tsx` (new file)

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { usePostHog } from "posthog-js/react";
import { Flex, Heading, Text, Button } from "@radix-ui/themes";
import { api } from "@/convex/_generated/api";
import { ROUTES } from "../routes";
import { QuizStepper } from "@/components/QuizStepper";
import { ContactCapture } from "@/components/quiz/ContactCapture";
import { BinaryQuestion } from "@/components/quiz/BinaryQuestion";
import { TextQuestion } from "@/components/quiz/TextQuestion";
import { SelectQuestion } from "@/components/quiz/SelectQuestion";
import { ArrowLeft } from "lucide-react";

// Quiz configuration
const SCORING_QUESTIONS = [
  {
    id: "q1_overwhelmed_options",
    question: "Do you often feel overwhelmed by the number of activity options?",
    description: "Whether it's Google, blogs, or social media recommendations",
  },
  {
    id: "q2_end_up_home",
    question: "Do you frequently end up staying home because you couldn't decide what to do?",
  },
  {
    id: "q3_same_activities",
    question: "Do you find yourself doing the same activities over and over?",
    description: "Playground, shopping centre, same cafe...",
  },
  {
    id: "q4_research_time",
    question: "Do you spend more than 30 minutes researching what to do?",
  },
  {
    id: "q5_weather_ruins",
    question: "Does unexpected weather often ruin your activity plans?",
    description: "Melbourne weather can be unpredictable!",
  },
  {
    id: "q6_energy_after_work",
    question: "Is finding energy for activities after work a challenge?",
  },
  {
    id: "q7_partner_disagree",
    question: "Do you and your partner often disagree on activity choices?",
  },
  {
    id: "q8_kids_bored",
    question: "Do your kids get bored with activities quickly?",
    description: "Constantly hearing 'I'm bored' or 'Can we go home?'",
  },
  {
    id: "q9_last_minute",
    question: "Do you often plan activities at the last minute?",
  },
  {
    id: "q10_guilt_screen_time",
    question: "Do you feel guilty when kids end up with too much screen time?",
  },
];

const SITUATION_OPTIONS = [
  { value: "working_parent", label: "Working Parent", description: "Balancing work and family time" },
  { value: "stay_at_home", label: "Stay-at-Home Parent", description: "Primary caregiver during the day" },
  { value: "shared_custody", label: "Shared Custody", description: "Quality time during custody periods" },
  { value: "grandparent_carer", label: "Grandparent/Carer", description: "Looking after grandkids or other children" },
];

const BUDGET_OPTIONS = [
  { value: "free_only", label: "Free activities only", description: "Budget is tight right now" },
  { value: "occasional_paid", label: "Occasional paid activities", description: "Mix of free and paid" },
  { value: "whatever_works", label: "Whatever works best", description: "Budget isn't the main concern" },
];

type QuizStep = "contact" | number | "complete";

interface QuizData {
  // Contact
  name: string;
  email: string;
  phone?: string;
  detectedCity?: string;
  detectedCountry?: string;
  // Scoring questions (0 or 1)
  q1_overwhelmed_options: number;
  q2_end_up_home: number;
  q3_same_activities: number;
  q4_research_time: number;
  q5_weather_ruins: number;
  q6_energy_after_work: number;
  q7_partner_disagree: number;
  q8_kids_bored: number;
  q9_last_minute: number;
  q10_guilt_screen_time: number;
  // Qualifying questions
  q11_situation: string;
  q12_desired_outcome: string;
  q13_obstacles: string;
  q14_budget_indicator: string;
  q15_anything_else?: string;
}

export default function QuizPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const submitQuiz = useMutation(api.quiz.submitQuizResponse);

  const [currentStep, setCurrentStep] = useState<QuizStep>("contact");
  const [quizData, setQuizData] = useState<Partial<QuizData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 16; // 1 contact + 10 scoring + 5 qualifying

  const getCurrentStepNumber = (): number => {
    if (currentStep === "contact") return 1;
    if (currentStep === "complete") return 16;
    return currentStep + 1; // +1 because contact is step 1
  };

  const handleContactSubmit = (data: QuizData["name"] extends string ? {
    name: string;
    email: string;
    phone?: string;
    detectedCity?: string;
    detectedCountry?: string;
  } : never) => {
    setQuizData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
    posthog?.capture("quiz_contact_submitted", {
      has_phone: !!data.phone,
      detected_city: data.detectedCity,
    });
  };

  const handleScoringAnswer = (questionId: string, value: number) => {
    setQuizData((prev) => ({ ...prev, [questionId]: value }));

    const currentIndex = SCORING_QUESTIONS.findIndex((q) => q.id === questionId);
    if (currentIndex < SCORING_QUESTIONS.length - 1) {
      setCurrentStep(currentIndex + 2); // +2 because contact is step 0 internally, first q is step 1
    } else {
      setCurrentStep(11); // Move to qualifying questions
    }

    posthog?.capture("quiz_question_answered", {
      question_id: questionId,
      question_number: currentIndex + 1,
      answer: value,
    });
  };

  const handleQualifyingAnswer = async (questionId: string, value: string) => {
    const updatedData = { ...quizData, [questionId]: value };
    setQuizData(updatedData);

    posthog?.capture("quiz_question_answered", {
      question_id: questionId,
      answer: value.substring(0, 50), // Truncate for analytics
    });

    // Determine next step
    if (questionId === "q11_situation") {
      setCurrentStep(12);
    } else if (questionId === "q12_desired_outcome") {
      setCurrentStep(13);
    } else if (questionId === "q13_obstacles") {
      setCurrentStep(14);
    } else if (questionId === "q14_budget_indicator") {
      setCurrentStep(15);
    } else if (questionId === "q15_anything_else") {
      // Submit the quiz
      await handleSubmit(updatedData as QuizData);
    }
  };

  const handleSubmit = async (data: QuizData) => {
    setIsSubmitting(true);

    try {
      const abVariant = posthog?.getFeatureFlag("landing-headline-test") as string | undefined;

      const result = await submitQuiz({
        name: data.name,
        email: data.email,
        phone: data.phone,
        detectedCity: data.detectedCity,
        detectedCountry: data.detectedCountry,
        q1_overwhelmed_options: data.q1_overwhelmed_options,
        q2_end_up_home: data.q2_end_up_home,
        q3_same_activities: data.q3_same_activities,
        q4_research_time: data.q4_research_time,
        q5_weather_ruins: data.q5_weather_ruins,
        q6_energy_after_work: data.q6_energy_after_work,
        q7_partner_disagree: data.q7_partner_disagree,
        q8_kids_bored: data.q8_kids_bored,
        q9_last_minute: data.q9_last_minute,
        q10_guilt_screen_time: data.q10_guilt_screen_time,
        q11_situation: data.q11_situation,
        q12_desired_outcome: data.q12_desired_outcome,
        q13_obstacles: data.q13_obstacles,
        q14_budget_indicator: data.q14_budget_indicator,
        q15_anything_else: data.q15_anything_else,
        abTestVariant: abVariant,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

      posthog?.capture("quiz_completed", {
        score: result.totalScore,
        score_percentage: result.scorePercentage,
      });

      // Redirect to results page
      router.push(ROUTES.build.quizResults(result.responseId));
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      posthog?.capture("quiz_submission_failed", { error: String(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "contact") {
      router.push(ROUTES.home);
    } else if (typeof currentStep === "number" && currentStep === 1) {
      setCurrentStep("contact");
    } else if (typeof currentStep === "number") {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render current step
  const renderStep = () => {
    if (currentStep === "contact") {
      return <ContactCapture onSubmit={handleContactSubmit} />;
    }

    if (typeof currentStep === "number" && currentStep >= 1 && currentStep <= 10) {
      const question = SCORING_QUESTIONS[currentStep - 1];
      return (
        <BinaryQuestion
          question={question.question}
          description={question.description}
          onAnswer={(value) => handleScoringAnswer(question.id, value)}
        />
      );
    }

    if (currentStep === 11) {
      return (
        <SelectQuestion
          question="Which best describes your situation?"
          options={SITUATION_OPTIONS}
          onAnswer={(value) => handleQualifyingAnswer("q11_situation", value)}
        />
      );
    }

    if (currentStep === 12) {
      return (
        <TextQuestion
          question="What would you like to achieve in the next 90 days?"
          description="With your kids, family time, or activities"
          placeholder="e.g., More quality time outdoors, try new experiences together..."
          onAnswer={(value) => handleQualifyingAnswer("q12_desired_outcome", value)}
        />
      );
    }

    if (currentStep === 13) {
      return (
        <TextQuestion
          question="What's currently stopping you from achieving this?"
          placeholder="e.g., Time, ideas, energy, budget..."
          onAnswer={(value) => handleQualifyingAnswer("q13_obstacles", value)}
        />
      );
    }

    if (currentStep === 14) {
      return (
        <SelectQuestion
          question="What type of activities fit your budget?"
          options={BUDGET_OPTIONS}
          onAnswer={(value) => handleQualifyingAnswer("q14_budget_indicator", value)}
        />
      );
    }

    if (currentStep === 15) {
      return (
        <TextQuestion
          question="Anything else you'd like us to know?"
          description="Optional - any specific challenges or preferences"
          placeholder="e.g., My kids are 3 and 5, we live in Brunswick..."
          multiline
          required={false}
          onAnswer={(value) => handleQualifyingAnswer("q15_anything_else", value)}
        />
      );
    }

    // Submitting state
    return (
      <Flex direction="column" align="center" gap="4">
        <Heading size="5">Calculating your results...</Heading>
        <Text color="gray">Please wait while we analyze your answers.</Text>
      </Flex>
    );
  };

  return (
    <Flex direction="column" align="center" gap="4" className="w-full max-w-lg">
      {/* Back button */}
      {currentStep !== "complete" && !isSubmitting && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      )}

      {/* Progress stepper */}
      {!isSubmitting && (
        <QuizStepper
          currentStep={getCurrentStepNumber()}
          totalSteps={totalSteps}
        />
      )}

      {/* Current step content */}
      {renderStep()}
    </Flex>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `pnpm tsc --noEmit`
- [x] Linting passes: `pnpm lint`
- [x] Build succeeds: `pnpm build`

#### Manual Verification:
- [ ] Contact capture step works with validation
- [ ] Location detection displays detected city
- [ ] Progress bar updates as user advances
- [ ] All 10 binary questions display correctly
- [ ] All 5 qualifying questions display correctly
- [ ] Back button navigates to previous step
- [ ] Quiz submits and redirects to results page

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 4.

---

## Phase 4: Results Page with Thermometer

### Overview
Build the results page with animated thermometer visualization, personalized insights, and CTA to the app.

### Changes Required:

#### 1. Thermometer Component

**File**: `components/quiz/Thermometer.tsx` (new file)

```typescript
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

  // Determine color based on percentage (inverted - higher = more decision fatigue = "warmer")
  const getColor = (pct: number) => {
    if (pct >= 70) return { bg: "bg-red-500", text: "text-red-600", label: "High Decision Fatigue" };
    if (pct >= 40) return { bg: "bg-orange-500", text: "text-orange-600", label: "Moderate Decision Fatigue" };
    return { bg: "bg-green-500", text: "text-green-600", label: "Low Decision Fatigue" };
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
                <Text size="1" color="gray">{mark}</Text>
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
```

#### 2. Results Page

**File**: `app/quiz/results/page.tsx` (new file)

```typescript
"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import Link from "next/link";
import { Button, Card, Flex, Heading, Text, Box, Container } from "@radix-ui/themes";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ROUTES } from "@/app/routes";
import { Thermometer } from "@/components/quiz/Thermometer";
import { Brain, Clock, Zap, ArrowRight } from "lucide-react";

// Insights based on score buckets
const INSIGHTS = {
  high: {
    title: "You're experiencing significant decision fatigue",
    description: "Your answers indicate that choosing activities is causing real stress. The good news? This is exactly what Tiny Tripper was built for.",
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
    description: "You've developed some coping strategies, but decision fatigue still affects your family time. Let us handle the planning.",
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
    description: "You've got solid systems in place. Tiny Tripper can still help you discover new activities and save time.",
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
  const insightKey = response.scorePercentage >= 70 ? "high" : response.scorePercentage >= 40 ? "medium" : "low";
  const insights = INSIGHTS[insightKey];

  return (
    <Container size="2" className="py-8 px-4">
      <Flex direction="column" align="center" gap="8">
        {/* Personalized greeting */}
        <Heading size="6" align="center">
          {response.name}, here are your results
        </Heading>

        {/* Thermometer visualization */}
        <Thermometer
          percentage={response.scorePercentage}
        />

        {/* The Big Reveal */}
        <Card size="3" className="w-full max-w-lg">
          <Flex direction="column" gap="3" p="4">
            <Heading size="4">{insights.title}</Heading>
            <Text color="gray">{insights.description}</Text>
          </Flex>
        </Card>

        {/* 3 Insights */}
        <Flex direction="column" gap="4" className="w-full max-w-lg">
          <Heading size="4" align="center">Your Personalized Insights</Heading>

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
                    <Text size="2" color="gray">{rec.tip}</Text>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Flex>

        {/* CTA */}
        <Flex direction="column" align="center" gap="4" className="w-full max-w-lg">
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
              <Text size="2" color="gray">Back to Home</Text>
            </Link>
            <Link href={ROUTES.privacyPolicy}>
              <Text size="2" color="gray">Privacy Policy</Text>
            </Link>
          </Flex>
        </Box>
      </Flex>
    </Container>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `pnpm tsc --noEmit`
- [x] Linting passes: `pnpm lint`
- [x] Build succeeds: `pnpm build`

#### Manual Verification:
- [ ] Thermometer animates on page load
- [ ] Correct color based on score (red for high, orange for medium, green for low)
- [ ] Personalized name appears in greeting
- [ ] Insights match the score bucket
- [ ] CTA button links to `/tt/play`
- [ ] Missing ID shows appropriate error state

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 5.

---

## Phase 5: A/B Testing & Analytics

### Overview
Set up PostHog feature flag for A/B testing headlines and ensure comprehensive analytics tracking.

### Changes Required:

#### 1. PostHog Feature Flag Setup

**Manual Step**: Create feature flag in PostHog dashboard

- Name: `landing-headline-test`
- Type: Multivariate
- Variants:
  - `frustration` (50%): Frustration hook headline
  - `results` (50%): Results hook headline
- Rollout: 100% of users

#### 2. Analytics Event Tracking Summary

The following events are tracked throughout the funnel (already implemented in previous phases):

| Event | Properties | Location |
|-------|------------|----------|
| `landing_page_viewed` | `headline_variant` | Landing page load |
| `quiz_contact_submitted` | `has_phone`, `detected_city` | Contact capture step |
| `quiz_question_answered` | `question_id`, `question_number`, `answer` | Each question |
| `quiz_completed` | `score`, `score_percentage` | Quiz submission |
| `quiz_submission_failed` | `error` | Submission error |
| `quiz_results_viewed` | `score`, `score_percentage` | Results page |

#### 3. Funnel Analysis Setup

**Manual Step**: Create PostHog funnel in dashboard

- Funnel: "Quiz Conversion Funnel"
- Steps:
  1. `landing_page_viewed`
  2. `quiz_contact_submitted`
  3. `quiz_completed`
  4. `quiz_results_viewed`

- Breakdown by: `headline_variant`

### Success Criteria:

#### Automated Verification:
- [x] No TypeScript errors related to PostHog: `pnpm tsc --noEmit`

#### Manual Verification:
- [ ] Feature flag created in PostHog dashboard
- [ ] A/B test shows correct variant distribution in PostHog
- [ ] All analytics events appear in PostHog debugger
- [ ] Funnel shows correct step progression

**Implementation Note**: This phase requires PostHog dashboard configuration. Verify that all events are being captured before considering complete.

---

## Testing Strategy

### Unit Tests

None required for initial implementation (form components use standard Radix UI patterns).

### Integration Tests

- Quiz submission stores data correctly in Convex
- Score calculation produces expected results
- Results page displays correct data for response ID

### Manual Testing Steps

1. **Landing Page Flow**:
   - Visit `/` and verify all sections render
   - Click "Start the Quiz" → should go to `/quiz`
   - Click "Try it Now" → should go to `/tt/play`
   - Refresh page multiple times → verify A/B variants appear

2. **Quiz Flow**:
   - Complete contact capture with valid data
   - Verify location detection shows (if in supported region)
   - Answer all 10 binary questions
   - Answer all 5 qualifying questions
   - Verify redirect to results page

3. **Results Page**:
   - Verify thermometer animates to correct percentage
   - Verify personalized name in greeting
   - Verify insights match score bucket
   - Click CTA → should go to `/tt/play`

4. **Edge Cases**:
   - Invalid email format → should show error
   - Empty required fields → should prevent submission
   - Direct access to `/quiz/results` without ID → should show error state
   - Back button during quiz → should navigate to previous step

## Performance Considerations

- IP geolocation API call is non-blocking (quiz can proceed while detecting)
- Thermometer animation uses CSS transitions (no JS animation library needed)
- Quiz state is client-side only until submission (reduces API calls)

## Migration Notes

No data migration needed. New `quizResponses` table is additive.

## References

- PostHog React integration: https://posthog.com/docs/libraries/react
- Radix UI RadioCards: https://www.radix-ui.com/themes/docs/components/radio-cards
- IP geolocation API: https://ipapi.co/
