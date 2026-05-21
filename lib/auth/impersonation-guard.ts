import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyImpersonationToken, IMPERSONATION_COOKIE, type ImpersonationSession } from "./impersonation";

/**
 * Get the active impersonation session from the cookie.
 * Returns null if not impersonating or token is invalid/expired.
 */
export async function getImpersonationSession(): Promise<ImpersonationSession | null> {
  try {
    const jar = await cookies();
    const token = jar.get(IMPERSONATION_COOKIE)?.value;
    if (!token) return null;
    return verifyImpersonationToken(token);
  } catch {
    return null;
  }
}

/**
 * Returns true if the current request is running under an impersonation session.
 * Uses the x-impersonation header set by middleware (fast path for RSC/layouts).
 */
export async function isImpersonating(): Promise<boolean> {
  try {
    const hdrs = await headers();
    if (hdrs.get("x-impersonation") === "1") return true;
  } catch { /* headers() may not be available in some contexts */ }
  // Fallback to cookie check
  const session = await getImpersonationSession();
  return session !== null;
}

/**
 * Throws a 403 JSON response if the request is an impersonation session.
 * Use this in Server Actions that mutate data.
 */
export async function requireMutableSession(): Promise<void> {
  const impersonating = await isImpersonating();
  if (impersonating) {
    throw new Error("READ_ONLY_IMPERSONATION_SESSION");
  }
}

/**
 * Returns a 403 NextResponse if the request is an impersonation session.
 * Use this in API Route Handlers before mutation logic.
 */
export async function requireApiMutable(): Promise<NextResponse | null> {
  const impersonating = await isImpersonating();
  if (impersonating) {
    return NextResponse.json(
      { ok: false, error: "เซสชันนี้เป็นโหมดอ่านอย่างเดียว (impersonation) ไม่สามารถแก้ไขข้อมูลได้", code: "READ_ONLY_IMPERSONATION_SESSION" },
      { status: 403 },
    );
  }
  return null;
}
