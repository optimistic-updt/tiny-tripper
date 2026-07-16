import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {},
  clientPrefix: "VITE_",
  client: {
    VITE_CONVEX_URL: z.string().startsWith("https://"),
    VITE_POSTHOG_KEY: z.string().startsWith("phc_"),
    VITE_POSTHOG_HOST: z
      .string()
      .refine((val) => val === "https://eu.i.posthog.com"),
    VITE_CLERK_PUBLISHABLE_KEY: z.string(),
    VITE_GOOGLE_MAPS_API_KEY: z.string(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
