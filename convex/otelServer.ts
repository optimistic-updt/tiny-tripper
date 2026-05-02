import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

type Properties = Record<string, unknown>;

type CtxLike = {
  auth: {
    getUserIdentity(): Promise<{ subject: string } | null>;
  };
  scheduler: {
    runAfter(ms: number, fn: unknown, args: unknown): Promise<unknown>;
  };
};

const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://eu.i.posthog.com";

export async function getDistinctId(ctx: {
  auth: { getUserIdentity(): Promise<{ subject: string } | null> };
}): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? "anonymous";
}

// Internal action that does the HTTP capture. Goes via the scheduler so this
// works from mutations too (mutations cannot call fetch directly).
export const sendCapture = internalAction({
  args: {
    event: v.string(),
    distinctId: v.string(),
    properties: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const key = process.env.POSTHOG_KEY;
    if (!key) return;
    try {
      await fetch(`${POSTHOG_HOST}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          event: args.event,
          distinct_id: args.distinctId,
          properties: args.properties,
        }),
      });
    } catch (err) {
      console.error("otelServer.sendCapture failed", err);
    }
  },
});

async function schedule(
  ctx: CtxLike,
  event: string,
  distinctId: string,
  properties?: Properties,
): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.otelServer.sendCapture, {
    event,
    distinctId,
    properties,
  });
}

export const otelServer = {
  async captureException(
    ctx: CtxLike,
    error: unknown,
    properties?: Properties,
  ): Promise<void> {
    const distinctId = await getDistinctId(ctx);
    const err = error instanceof Error ? error : new Error(String(error));
    await schedule(ctx, "$exception", distinctId, {
      $exception_list: [
        {
          type: err.name,
          value: err.message,
          stacktrace: err.stack,
          mechanism: { handled: true, synthetic: false },
        },
      ],
      ...properties,
    });
  },

  async captureEvent(
    ctx: CtxLike,
    eventName: string,
    properties?: Properties,
  ): Promise<void> {
    const distinctId = await getDistinctId(ctx);
    await schedule(ctx, eventName, distinctId, properties);
  },

  async log(
    ctx: CtxLike,
    level: "log" | "warn" | "error",
    message: string,
    properties?: Properties,
  ): Promise<void> {
    console[level](message, properties ?? "");
    if (level === "error") {
      await otelServer.captureException(ctx, new Error(message), properties);
    }
  },
};
