import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTag } from "./activities";

/**
 * Explicit remaps for legacy tag strings whose canonical form requires more
 * than trim+lowercase. Keys are already normalized (lowercased + trimmed) so
 * lookups happen after the generic normalize step.
 */
const LEGACY_TAG_REMAP: Record<string, string> = {
  "rain-approved": "rain approved",
};

function canonicalizeTag(raw: string): string {
  const normalized = normalizeTag(raw);
  return LEGACY_TAG_REMAP[normalized] ?? normalized;
}

/**
 * One-time migration: rewrite tag strings on every activity and in the
 * `tags` table to the canonical lowercase-with-spaces form, and collapse
 * duplicates created by the normalization.
 *
 * Idempotent — safe to run multiple times.
 *
 * Invoke from the Convex dashboard:
 *     mutation: migrations.normalizeAllTags
 */
export const normalizeAllTags = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;

    let activitiesChanged = 0;
    let tagsDeleted = 0;
    let tagsUpdated = 0;

    // --- activities.tags ---
    const activities = await ctx.db.query("activities").collect();
    for (const activity of activities) {
      if (!activity.tags || activity.tags.length === 0) continue;

      const canonical = Array.from(
        new Set(
          activity.tags.map(canonicalizeTag).filter((t) => t.length > 0),
        ),
      );

      const changed =
        canonical.length !== activity.tags.length ||
        canonical.some((t, i) => t !== activity.tags![i]);

      if (changed) {
        activitiesChanged++;
        if (!dryRun) {
          await ctx.db.patch(activity._id, { tags: canonical });
        }
      }
    }

    // --- tags table ---
    // Walk every row, canonicalize the name, and merge collisions by keeping
    // the oldest `createdAt` row and deleting the rest.
    const allTags = await ctx.db.query("tags").collect();
    const canonicalToKept = new Map<string, typeof allTags[number]>();

    // First pass: pick the oldest row per canonical name.
    for (const tag of allTags) {
      const canonical = canonicalizeTag(tag.name);
      if (!canonical) continue;
      const current = canonicalToKept.get(canonical);
      if (!current || tag.createdAt < current.createdAt) {
        canonicalToKept.set(canonical, tag);
      }
    }

    // Second pass: update kept rows to canonical name, delete the rest.
    for (const tag of allTags) {
      const canonical = canonicalizeTag(tag.name);
      if (!canonical) {
        tagsDeleted++;
        if (!dryRun) await ctx.db.delete(tag._id);
        continue;
      }

      const kept = canonicalToKept.get(canonical);
      if (kept && kept._id === tag._id) {
        if (tag.name !== canonical) {
          tagsUpdated++;
          if (!dryRun) {
            await ctx.db.patch(tag._id, { name: canonical });
          }
        }
      } else {
        tagsDeleted++;
        if (!dryRun) await ctx.db.delete(tag._id);
      }
    }

    return {
      dryRun,
      activitiesChanged,
      tagsUpdated,
      tagsDeleted,
    };
  },
});
