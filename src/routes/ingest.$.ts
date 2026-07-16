import { createFileRoute } from "@tanstack/react-router";

// Reverse proxy for PostHog ingestion (was `rewrites()` in next.config.mjs).
// Serving analytics through a first-party path keeps requests out of
// ad-blocker deny lists. posthog-js is configured with api_host "/ingest".
const POSTHOG_HOST = "https://eu.i.posthog.com";
const POSTHOG_ASSETS_HOST = "https://eu-assets.i.posthog.com";

async function proxyToPostHog({
  request,
  params,
}: {
  request: Request;
  params: { _splat?: string };
}) {
  const path = params._splat ?? "";
  const search = new URL(request.url).search;
  const origin = path.startsWith("static/")
    ? POSTHOG_ASSETS_HOST
    : POSTHOG_HOST;

  const headers = new Headers(request.headers);
  // Let fetch derive host/length for the upstream request.
  headers.delete("host");
  headers.delete("content-length");

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const upstream = await fetch(`${origin}/${path}${search}`, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  // fetch already decompressed the body; drop stale encoding headers.
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const Route = createFileRoute("/ingest/$")({
  server: {
    handlers: {
      GET: proxyToPostHog,
      POST: proxyToPostHog,
      PUT: proxyToPostHog,
      PATCH: proxyToPostHog,
      DELETE: proxyToPostHog,
      OPTIONS: proxyToPostHog,
      HEAD: proxyToPostHog,
    },
  },
});
