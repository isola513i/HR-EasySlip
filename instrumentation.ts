// Next.js instrumentation hook — wires Sentry into the right runtime.
// Required by @sentry/nextjs >= 8 instead of legacy sentry.*.config.ts roots.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Surface React Server Component / route errors to Sentry.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
