// Browser-side Sentry init. Loaded automatically by @sentry/nextjs when
// SENTRY_DSN (or NEXT_PUBLIC_SENTRY_DSN) is set; otherwise it no-ops so
// dev environments without a DSN run cleanly.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Avoid sending PII — payroll/PDPA boundary
    sendDefaultPii: false,
  });
}

// Fallback global handlers for environments where Sentry is not configured.
// Sentry.init() registers these automatically when a DSN is present;
// these ensure uncaught errors are always visible in the console.
if (!dsn && typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("[Unhandled Error]", event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Unhandled Promise Rejection]", event.reason);
  });
}
