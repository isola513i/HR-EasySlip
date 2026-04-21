import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-safe cookie-presence gate. PrismaAdapter cannot run on Next.js Edge
// runtime, so middleware must not call `auth()` (which transitively imports
// Prisma via lib/auth.ts). Real session validation lives in server components
// and route handlers (Node.js runtime) via `await auth()`.
const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const PROTECTED_PREFIX_RE = /^\/(hr|employee|manager)(\/|$)/;

export default function middleware(req: NextRequest): NextResponse {
  const { nextUrl } = req;
  const isProtected = PROTECTED_PREFIX_RE.test(nextUrl.pathname);
  if (!isProtected) return NextResponse.next();

  const hasSession = SESSION_COOKIE_NAMES.some((name) =>
    req.cookies.has(name),
  );
  if (hasSession) return NextResponse.next();

  const signinUrl = new URL("/signin", nextUrl);
  signinUrl.searchParams.set("callbackUrl", nextUrl.pathname);
  return NextResponse.redirect(signinUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
