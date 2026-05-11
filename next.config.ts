import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// unsafe-eval is only required for Next.js HMR in development; not needed in production.
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "report-uri /api/v1/csp-report",
    ].join("; "),
  },
  {
    // Report-only Trusted Types enforcement — identifies violations without breaking the app.
    // Promote to Content-Security-Policy once all violations are resolved.
    key: "Content-Security-Policy-Report-Only",
    value: "require-trusted-types-for 'script'; report-uri /api/v1/csp-report",
  },
];

// Relaxed CSP for Scalar API docs (CDN scripts/styles)
const docsSecurityHeaders = securityHeaders.map((h) => {
  if (h.key !== "Content-Security-Policy") return h;
  return {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://cdn.jsdelivr.net`,
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "img-src 'self' data: blob:",
      "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com",
      "connect-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "report-uri /api/v1/csp-report",
    ].join("; "),
  };
});

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/api/docs",
        headers: docsSecurityHeaders,
      },
      {
        source: "/((?!api/docs).*)",
        headers: securityHeaders,
      },
    ];
  },
};

// Wrap with Sentry only when DSN is configured to avoid build-time errors
// in dev environments without Sentry credentials. Source map upload is
// best-effort: missing org/project/auth-token simply skips the upload step.
const sentryEnabled = !!process.env.SENTRY_DSN;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
