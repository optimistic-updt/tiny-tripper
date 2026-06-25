import { v } from "convex/values";
import { action } from "./_generated/server";
import { env } from "./env";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { otelServer } from "./otelServer";

// Single swappable model constant. Verified valid against the live API.
// Fallback: gpt-5 (also a reasoning model, supports `reasoning.effort`).
// NOTE: gpt-4.1-mini / gpt-4o-mini do NOT support `reasoning.effort` — switching
// to a non-reasoning model requires removing the `reasoning` field below.
const EXTRACTION_MODEL = "gpt-5-mini";
// Keep below the client's 25s drop so the action self-resolves first.
const OPENAI_REQUEST_TIMEOUT_MS = 20_000;

const OpenAIClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// Structured output schema. Every field is nullable so the model can decline
// anything it cannot confidently read from the image.
const ExtractionSchema = z.object({
  name: z.string().nullable(),
  description: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  rainApproved: z.boolean().nullable(),
  inHome: z.boolean().nullable(),
});

const SYSTEM_PROMPT = `You extract structured event details from a single image. The image will either be of an event flyer or poster or of an activity.

if the image is of a flyer or poster, try to extract the text.

if it's of an activity, generate a name and description (1 or 2 lines) that would describe the activity

use null for anything missing or ambiguous.
- name: the event/activity title as printed. null if unclear.
- description: a 1-2 sentence summary of what the event is. null if you cannot summarize.
- tags: free-form lowercase category keywords (e.g. "music", "kids", "art", "food", "outdoor").
  One tag per category, no synonyms or near-duplicates (pick the single best word).
  Cap at 5 tags; prefer fewer, high-signal tags.
  DO NOT include "rain approved", "rain-approved", "at home", "in home", "indoor", or
  "outdoor location" phrasing here — those are captured by the boolean fields below.
- rainApproved: true only if the flyer clearly indicates the activity works in rain /
  is weatherproof / explicitly "rain or shine". null if unstated.
- inHome: true only if this is explicitly an at-home / online / virtual activity. null if unstated.
Output strictly matches the provided JSON schema.`;

/**
 * Extract activity fields from a flyer/poster image for pre-filling the Create
 * Activity form. Image bytes are passed inline as a base64 data URL so the call
 * never waits on storage upload. Requires a signed-in user (cheap abuse
 * protection on the public /tt/create route). Throws on any failure — the client
 * treats failures silently and never blocks image upload or form submission.
 */
export const extractActivityFromImage = action({
  args: { imageBase64: v.string() },
  returns: v.object({
    name: v.union(v.string(), v.null()),
    description: v.union(v.string(), v.null()),
    tags: v.union(v.array(v.string()), v.null()),
    rainApproved: v.union(v.boolean(), v.null()),
    inHome: v.union(v.boolean(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: sign in to extract activity from image");
    }

    try {
      const response = await OpenAIClient.responses.parse(
        {
          model: EXTRACTION_MODEL,
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: "Extract the activity details from this image.",
                },
                {
                  type: "input_image",
                  image_url: args.imageBase64,
                  detail: "auto",
                },
              ],
            },
          ],
          text: {
            format: zodTextFormat(ExtractionSchema, "activity_extraction"),
          },
        },
        { timeout: OPENAI_REQUEST_TIMEOUT_MS },
      );

      const parsed = response.output_parsed;
      return {
        name: parsed?.name ?? null,
        description: parsed?.description ?? null,
        tags: parsed?.tags ?? null,
        rainApproved: parsed?.rainApproved ?? null,
        inHome: parsed?.inHome ?? null,
      };
    } catch (error) {
      console.error("extractActivityFromImage failed", error);
      await otelServer.captureException(ctx, error, {
        context: "extract_activity_from_image",
      });
      throw error;
    }
  },
});
