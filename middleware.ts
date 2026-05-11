import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from "@/lib/i18n/config";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const PROTECTED_PREFIX_RE = /^\/(hr|employee|change-password)(\/|$)/;

export default function middleware(req: NextRequest): NextResponse {
  const { nextUrl } = req;

  // Ensure locale cookie exists on every request
  const localeCookie = req.cookies.get(LOCALE_COOKIE)?.value;
  const needsLocale =
    !localeCookie || !LOCALES.includes(localeCookie as (typeof LOCALES)[number]);

  const isProtected = PROTECTED_PREFIX_RE.test(nextUrl.pathname);

  // Not protected — just set locale cookie if missing
  if (!isProtected) {
    if (needsLocale) {
      const res = NextResponse.next();
      res.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return res;
    }
    return NextResponse.next();
  }

  // Protected routes — check session
  const hasSession = SESSION_COOKIE_NAMES.some((name) =>
    req.cookies.has(name),
  );

  if (hasSession) {
    if (needsLocale) {
      const res = NextResponse.next();
      res.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return res;
    }
    return NextResponse.next();
  }

  const signinUrl = new URL("/signin", nextUrl);
  signinUrl.searchParams.set("callbackUrl", nextUrl.pathname);
  return NextResponse.redirect(signinUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|sw\\.js|manifest).*)"],
};
