"use client";

import posthog from "posthog-js";

type Properties = Record<string, unknown>;

export const otel = {
  captureException(error: unknown, properties?: Properties): void {
    posthog.captureException(error, properties);
  },

  captureEvent(eventName: string, properties?: Properties): void {
    posthog.capture(eventName, properties);
  },

  log(
    level: "log" | "warn" | "error",
    message: string,
    properties?: Properties,
  ): void {
    console[level](message, properties ?? "");
    if (level === "error") {
      posthog.captureException(new Error(message), properties);
    }
  },
};
