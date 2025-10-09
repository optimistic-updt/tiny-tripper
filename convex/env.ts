import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().startsWith("sk_"),
    CLERK_JWT_ISSUER_DOMAIN: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
    OPENAI_API_KEY: z.string().startsWith("sk-"),
    FIRECRAWL_API_KEY: z.string().min(1),
    FETCHFOX_API_KEY: z.string().min(1),
    GOOGLE_MAPS_API_KEY: z.string().min(1),
  },
  client: {},
  clientPrefix: "NEXT_PUBLIC_",
  runtimeEnv: process.env,
});
