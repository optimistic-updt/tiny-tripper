// @ts-check
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
const jiti = createJiti(fileURLToPath(import.meta.url));

// Import env here to validate during build. Using jiti@^1 we can import .ts files :)
await jiti.import("./env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */

  // Rewrites needed for PostHog traffic proxying
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },

  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
