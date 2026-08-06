// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://4a3e5d1ca7315c1e4df9a6812f1a1f4f@o4511825738792960.ingest.de.sentry.io/4511825763172432",

  // Replay: only load in production and at a low rate to avoid mobile CPU drain.
  integrations: isProd && typeof window !== "undefined" && typeof Sentry.replayIntegration === "function"
    ? [Sentry.replayIntegration()]
    : [],

  // Reduced from 1.0 → 0.05 in production. Tracing 100% of sessions tanks mobile performance.
  tracesSampleRate: isProd ? 0.05 : 1.0,

  // Reduced from 10% → 2% to minimize Replay worker CPU usage on mobile.
  replaysSessionSampleRate: isProd ? 0.02 : 0,

  // Keep 100% on error for debugging issues in production.
  replaysOnErrorSampleRate: isProd ? 1.0 : 0,

  // NEVER enable debug in production — causes heavy console logging.
  debug: false,
});
