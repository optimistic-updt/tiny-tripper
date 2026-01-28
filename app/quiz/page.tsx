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
    question:
      "Do you frequently end up staying home because you couldn't decide what to do?",
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
  {
    value: "working_parent",
    label: "Working Parent",
    description: "Balancing work and family time",
  },
  {
    value: "stay_at_home",
    label: "Stay-at-Home Parent",
    description: "Primary caregiver during the day",
  },
  {
    value: "shared_custody",
    label: "Shared Custody",
    description: "Quality time during custody periods",
  },
  {
    value: "grandparent_carer",
    label: "Grandparent/Carer",
    description: "Looking after grandkids or other children",
  },
];

const BUDGET_OPTIONS = [
  {
    value: "free_only",
    label: "Free activities only",
    description: "Budget is tight right now",
  },
  {
    value: "occasional_paid",
    label: "Occasional paid activities",
    description: "Mix of free and paid",
  },
  {
    value: "whatever_works",
    label: "Whatever works best",
    description: "Budget isn't the main concern",
  },
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

interface ContactData {
  name: string;
  email: string;
  phone?: string;
  detectedCity?: string;
  detectedCountry?: string;
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

  const handleContactSubmit = (data: ContactData) => {
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
      const abVariant = posthog?.getFeatureFlag("landing-headline-test") as
        | string
        | undefined;

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
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
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
          key="q11"
          question="Which best describes your situation?"
          options={SITUATION_OPTIONS}
          onAnswer={(value) => handleQualifyingAnswer("q11_situation", value)}
        />
      );
    }

    if (currentStep === 12) {
      return (
        <TextQuestion
          key="q12"
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
          key="q13"
          question="What's currently stopping you from achieving this?"
          placeholder="e.g., Time, ideas, energy, budget..."
          onAnswer={(value) => handleQualifyingAnswer("q13_obstacles", value)}
        />
      );
    }

    if (currentStep === 14) {
      return (
        <SelectQuestion
          key="q14"
          question="What type of activities fit your budget?"
          options={BUDGET_OPTIONS}
          onAnswer={(value) =>
            handleQualifyingAnswer("q14_budget_indicator", value)
          }
        />
      );
    }

    if (currentStep === 15) {
      return (
        <TextQuestion
          key="q15"
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
        <Button variant="ghost" onClick={handleBack} className="self-start">
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
