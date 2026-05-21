import { SignJWT, jwtVerify } from "jose";
import { JWT_ALG, getJwtSecret } from "./platform-constants";

export const IMPERSONATION_COOKIE = "impersonation-token";

export interface ImpersonationSession {
  impersonationId: string;
  platformUserId: string;
  platformEmail: string;
  tenantId: string;
  tenantSlug: string;
  expiresAt: number; // unix ms — for banner display only; JWT exp enforces the actual expiry
}

export async function createImpersonationToken(session: ImpersonationSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getJwtSecret());
}

/**
 * Sets the impersonation JWT cookie.
 * Requires a Server Action / Route Handler context (next/headers cookies()).
 */
export async function setImpersonationCookie(
  cookieStore: Awaited<ReturnType<typeof import("next/headers").cookies>>,
  token: string,
): Promise<void> {
  cookieStore.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function verifyImpersonationToken(token: string): Promise<ImpersonationSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const p = payload as Record<string, unknown>;
    if (!p.impersonationId || !p.platformUserId || !p.platformEmail || !p.tenantId || !p.tenantSlug || !p.expiresAt) return null;
    return {
      impersonationId: String(p.impersonationId),
      platformUserId: String(p.platformUserId),
      platformEmail: String(p.platformEmail),
      tenantId: String(p.tenantId),
      tenantSlug: String(p.tenantSlug),
      expiresAt: Number(p.expiresAt),
    };
  } catch {
    return null;
  }
}
