import { NextRequest, NextResponse } from "next/server";
import { verifyImpersonationToken, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";

// Receives the JWT token from the SuperAdmin platform, sets it as a cookie
// for the current tenant subdomain, then redirects to the impersonation landing page.
// Using a Route Handler (not a Server Action) so we can write Set-Cookie in a GET
// response without cross-origin restrictions.
export async function GET(req: NextRequest) {
  // req.url uses Next.js internal localhost URL in dev — derive base from host header.
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const base = `${proto}://${host}`;

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/", base));

  const session = await verifyImpersonationToken(token);
  if (!session) return NextResponse.redirect(new URL("/", base));

  const res = NextResponse.redirect(new URL("/impersonation", base));
  res.cookies.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
    // No domain attribute — scoped to the current tenant subdomain only.
  });
  return res;
}
