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
