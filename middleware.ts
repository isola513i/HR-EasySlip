// Force Node.js runtime so Prisma's native binary works in middleware.
// On Vercel this uses Fluid Compute — same regions, same price, full Node.js.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "@/lib/i18n/config";
import { extractSubdomain, resolveTenantBySlug } from "@/lib/db/tenant-resolver";
import { PLATFORM_COOKIE_NAME } from "@/lib/auth/platform-constants";
import { IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";
const ADMIN_SUBDOMAIN = "admin";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const PLATFORM_PUBLIC_PATHS = new Set(["/signin"]);

// Within the tenant zone: paths that don't require a session
const TENANT_PUBLIC_PATHS = new Set([
  "/signin",
  "/consent",
  "/forbidden",
  "/impersonation",
  "/impersonation/handoff",
]);
// Paths that require a session
const TENANT_PROTECTED_RE = /^\/(hr|employee|manager|change-password|dashboard)(\/|$)/;

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Hard guard: skip ALL Next.js internals that may bypass the matcher
  // (Turbopack HMR, webpack-hmr, error overlay, data routes, etc.)
  if (pathname.startsWith("/_next/") || pathname.startsWith("/__nextjs")) {
    return NextResponse.next();
  }

  const host = req.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host, ROOT_DOMAIN);

  // ── 1. Marketing zone (apex / www — no subdomain) ───────────────
  // Block direct access to /platform/* from the marketing zone so platform
  // pages are only reachable via the admin subdomain rewrite below.
  if (!subdomain) {
    if (pathname.startsWith("/platform/") || pathname === "/platform") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return withLocale(req, NextResponse.next());
  }

  // ── 2. Platform zone (admin.*) ──────────────────────────────────
  // Pages live in app/platform/* — middleware rewrites every request to
  // /platform{pathname} so Next.js serves the right page without URL path
  // conflicts with the tenant zone (which also has /signin, etc.).
  if (subdomain === ADMIN_SUBDOMAIN) {
    if (!PLATFORM_PUBLIC_PATHS.has(pathname)) {
      const hasSession = req.cookies.has(PLATFORM_COOKIE_NAME);
      if (!hasSession) {
        const signinUrl = new URL("/signin", req.url);
        return NextResponse.redirect(signinUrl);
      }
    }
    const rewriteTarget = new URL(
      `/platform${pathname === "/" ? "" : pathname}`,
      req.url,
    );
    rewriteTarget.search = req.nextUrl.search;
    return withLocale(req, NextResponse.rewrite(rewriteTarget));
  }

  // ── 3. Tenant zone ──────────────────────────────────────────────
  const tenant = await resolveTenantBySlug(subdomain);

  if (!tenant) {
    // Rewrite to Next.js's internal not-found handler (always exists, returns 404).
    // app/not-found.tsx detects the subdomain via the preserved host header and
    // renders the tenant-not-found UI.
    return withLocale(req, NextResponse.rewrite(new URL("/_not-found", req.url)));
  }

  // Redirect trial-expired tenants everywhere except billing
  if (tenant.status === "TRIAL_EXPIRED" && pathname !== "/settings/billing") {
    return NextResponse.redirect(new URL("/settings/billing", req.url));
  }

  if (tenant.status === "SUSPENDED" || tenant.status === "DELETED") {
    const forbiddenUrl = new URL("/forbidden", req.url);
    forbiddenUrl.searchParams.set("reason", "suspended");
    return NextResponse.redirect(forbiddenUrl);
  }

  // Auth gate for protected paths
  if (TENANT_PROTECTED_RE.test(pathname) && !TENANT_PUBLIC_PATHS.has(pathname)) {
    const hasSession =
      SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name)) ||
      req.cookies.has(IMPERSONATION_COOKIE);
    if (!hasSession) {
      const signinUrl = new URL("/signin", req.url);
      signinUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  const res = NextResponse.next();
  res.headers.set("x-tenant-id", tenant.id);
  res.headers.set("x-tenant-slug", tenant.slug);
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
     * - _next/* : ALL Next.js / Turbopack internals (static chunks, image opt,
     *             webpack-hmr, error overlay, data routes, …)
     * - api/*   : API routes
     * - public/ : favicon, icons, sw.js, manifest*, robots.txt, sitemap.xml
     */
    "/((?!_next|api|favicon\\.ico|icons|sw\\.js|manifest|robots\\.txt|sitemap\\.xml).*)",
  ],
};
