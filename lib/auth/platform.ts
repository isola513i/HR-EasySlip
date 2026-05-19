import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PlatformRole } from "@/lib/db/generated/control-plane";
import { PLATFORM_COOKIE_NAME, JWT_ALG, getJwtSecret } from "./platform-constants";

export { PLATFORM_COOKIE_NAME };

export interface PlatformSession {
  userId: string;
  email: string;
  role: PlatformRole;
}

export async function createPlatformSession(session: PlatformSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());
}

export async function getPlatformSession(): Promise<PlatformSession | null> {
  try {
    const jar = await cookies();
    const token = jar.get(PLATFORM_COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getJwtSecret());
    const { userId, email, role } = payload as Record<string, string>;
    if (!userId || !email || !role) return null;
    return { userId, email, role: role as PlatformRole };
  } catch {
    return null;
  }
}

export async function requirePlatformSession(
  allowed?: PlatformRole[]
): Promise<PlatformSession> {
  const session = await getPlatformSession();
  if (!session) redirect("/signin");
  if (allowed && !allowed.includes(session.role)) redirect("/forbidden");
  return session;
}
