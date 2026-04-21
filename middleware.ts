import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PREFIX_RE = /^\/(hr|employee|manager)(\/|$)/;

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthed = !!req.auth;
  const isProtected = PROTECTED_PREFIX_RE.test(nextUrl.pathname);

  if (isProtected && !isAuthed) {
    const signinUrl = new URL("/signin", nextUrl);
    signinUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
