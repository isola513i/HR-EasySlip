// Force Node.js runtime so Prisma's native binary works in middleware.
// On Vercel this uses Fluid Compute — same regions, same price, full Node.js.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "@/lib/i18n/config";
import { resolveTenantBySlug } from "@/lib/db/tenant-resolver";
import { PLATFORM_COOKIE_NAME } from "@/lib/auth/platform-constants";
import { IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";
import { RESERVED_SLUGS, TENANT_SLUG_RE } from "@/lib/tenant/reserved-slugs";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

// Platform: paths accessible without a platform session
const PLATFORM_PUBLIC_PATHS = new Set(["/signin", "/signin/error"]);

// Tenant zone: paths that do NOT require an end-user session
const TENANT_PUBLIC_PATHS = new Set([
  "/signin",
  "/consent",
  "/forbidden",
  "/impersonation",
]);

// Rest-paths (after /{slug}) that DO require a session
const TENANT_PROTECTED_RE = /^\/(hr|employee|manager|change-password|dashboard)(\/|$)/;

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Hard guard: skip ALL Next.js internals
  if (pathname.startsWith("/_next/") || pathname.startsWith("/__nextjs")) {
    return NextResponse.next();
  }

  // Extract the first URL path segment to determine routing zone
  const firstSeg = pathname.split("/")[1] ?? "";

  // ── 1. Platform zone ──────────────────────────────────────────────────────
  // Auth-gated; pages live in app/platform/* (no subdomain rewrite needed)
  if (firstSeg === "platform") {
    const restPath = pathname.slice("/platform".length) || "/";
    if (!PLATFORM_PUBLIC_PATHS.has(restPath)) {
      if (!req.cookies.has(PLATFORM_COOKIE_NAME)) {
        return NextResponse.redirect(new URL("/platform/signin", req.url));
      }
    }
    return withLocale(req, NextResponse.next());
  }

  // ── 2. Marketing / public zone ────────────────────────────────────────────
  // Reserved slugs and the root path pass through without tenant resolution.
  if (!firstSeg || RESERVED_SLUGS.has(firstSeg)) {
    return withLocale(req, NextResponse.next());
  }

  // ── 3. Tenant zone ────────────────────────────────────────────────────────
  const slug = firstSeg;

  // Reject slugs that don't match the allowed format (avoids CP lookup for garbage)
  if (!TENANT_SLUG_RE.test(slug)) {
    return withLocale(req, NextResponse.next());
  }

  const tenant = await resolveTenantBySlug(slug);

  if (!tenant) {
    // Rewrite to Next.js's internal not-found handler so app/not-found.tsx renders
    return withLocale(req, NextResponse.rewrite(new URL("/_not-found", req.url)));
  }

  // Rest-path: everything after /{slug}, e.g. "/hr/employees"
  const restPath = pathname.slice(slug.length + 1) || "/";

  if (tenant.status === "TRIAL_EXPIRED" && restPath !== "/settings/billing") {
    return NextResponse.redirect(new URL(`/${slug}/settings/billing`, req.url));
  }

  if (tenant.status === "SUSPENDED" || tenant.status === "DELETED") {
    const forbiddenUrl = new URL(`/${slug}/forbidden`, req.url);
    forbiddenUrl.searchParams.set("reason", "suspended");
    return NextResponse.redirect(forbiddenUrl);
  }

  // Auth gate: session required for protected sub-paths
  if (TENANT_PROTECTED_RE.test(restPath) && !TENANT_PUBLIC_PATHS.has(restPath)) {
    const hasSession =
      SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name)) ||
      req.cookies.has(IMPERSONATION_COOKIE);
    if (!hasSession) {
      const signinUrl = new URL(`/${slug}/signin`, req.url);
      signinUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  // ── Impersonation: read-only perimeter ────────────────────────────────────
  const impToken = req.cookies.get(IMPERSONATION_COOKIE)?.value;
  if (impToken) {
    // Block payroll & salary-history paths entirely
    const isPayrollPath =
      /^\/(hr\/)?payroll(\/|$)/.test(restPath) ||
      /^\/api\/v1\/payroll(\/|$)/.test(pathname) ||
      /^\/api\/v1\/hr\/employees\/[^/]+\/salary-history(\/|$)/.test(pathname);

    if (isPayrollPath) {
      const forbiddenUrl = new URL(`/${slug}/forbidden`, req.url);
      forbiddenUrl.searchParams.set("reason", "impersonation_blocked");
      return NextResponse.redirect(forbiddenUrl);
    }

    // Block mutating HTTP verbs on /api/* (except impersonation end action)
    const isMutatingApi =
      pathname.startsWith("/api/") &&
      ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) &&
      !pathname.startsWith("/api/v1/impersonation/end");

    if (isMutatingApi) {
      return NextResponse.json(
        { error: "Forbidden", code: "READ_ONLY_IMPERSONATION_SESSION", message: "Read-only support session" },
        { status: 403 },
      );
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-id", tenant.id);
  requestHeaders.set("x-tenant-slug", tenant.slug);
  if (impToken) requestHeaders.set("x-impersonation", "1");
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  return withLocale(req, res);
}

function withLocale(req: NextRequest, res: NextResponse): NextResponse {
  const localeCookie = req.cookies.get(LOCALE_COOKIE)?.value;
  const needsLocale = !localeCookie || !LOCALES.includes(localeCookie as (typeof LOCALES)[number]);
  if (needsLocale) {
    res.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/* : ALL Next.js / Turbopack internals
     * - api/*   : API routes (auth-gated per-route)
     * - public/ : favicon, icons, sw.js, manifest*, robots.txt, sitemap.xml
     */
    "/((?!_next|api|favicon\\.ico|icons|sw\\.js|manifest|robots\\.txt|sitemap\\.xml).*)",
  ],
};
