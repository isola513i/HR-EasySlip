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
