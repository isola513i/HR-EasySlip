import { createHmac } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { JWT_ALG, getJwtSecret } from "./platform-constants";

const APPROVAL_TTL_MIN = Number(process.env.IMPERSONATION_APPROVAL_TTL_MIN ?? "30");
const REQUIRE_APPROVAL = process.env.IMPERSONATION_REQUIRE_APPROVAL !== "false";

export { REQUIRE_APPROVAL };

export function approvalTtlMs(): number {
  return APPROVAL_TTL_MIN * 60 * 1_000;
}

export function approvalExpiresAt(): Date {
  return new Date(Date.now() + approvalTtlMs());
}

/** SHA-256 of the raw token — stored in DB for lookup without storing raw token */
export function hashApprovalToken(token: string): string {
  return createHmac("sha256", "approval-token-hash").update(token).digest("hex");
}

interface ApprovalPayload {
  requestId: string;
  tenantId: string;
  [key: string]: string; // satisfy JWTPayload index signature
}

export async function createApprovalToken(payload: ApprovalPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(`${APPROVAL_TTL_MIN}m`)
    .sign(getJwtSecret());
}

export async function verifyApprovalToken(token: string): Promise<ApprovalPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const { requestId, tenantId } = payload as Record<string, unknown>;
    if (typeof requestId !== "string" || typeof tenantId !== "string") return null;
    return { requestId, tenantId };
  } catch {
    return null;
  }
}
