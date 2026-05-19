export const PLATFORM_COOKIE_NAME = "platform-session";
export const JWT_ALG = "HS256";

export function getJwtSecret(): Uint8Array {
  // AUTH_SECRET = NextAuth v5 name; NEXTAUTH_SECRET = legacy v4 name
  const key =
    process.env.PLATFORM_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET;
  if (!key) throw new Error("PLATFORM_SESSION_SECRET not set");
  return new TextEncoder().encode(key);
}
