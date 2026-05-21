import { NextResponse } from "next/server";
import { z } from "zod";
import { getControlPlane } from "@/lib/db/control-plane";
import { getTenantPrisma } from "@/lib/db/tenant";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { parseBody } from "@/lib/api/validate";
import { apiOk, apiError } from "@/lib/api/response";
import { verifyPassword, BLOCKED_EMPLOYMENT_STATUSES } from "@/lib/auth/password-utils";
import { logAuthEvent } from "@/lib/audit/logger";
import { authEndpointLimiter, signInAttemptLimiter } from "@/lib/security/rate-limit";

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = withApiHandler(async (req, ctx) => {
  const { email, password } = await parseBody(req, LoginSchema);
  const emailLower = email.toLowerCase();
  const cp = getControlPlane();

  const user = await cp.user.findUnique({
    where: { email: emailLower },
    select: { id: true, passwordHash: true, isDisabled: true, mustChangePassword: true },
  });

  // Don't reveal whether user exists
  if (!user || !user.passwordHash) {
    return apiError("INVALID_CREDENTIALS", "อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
  }

  const lockout = signInAttemptLimiter.peek(user.id);
  if (!lockout.success) {
    logAuthEvent("auth.blocked", user.id, { ipAddress: ctx.ip, userAgent: ctx.userAgent, reason: "Account locked" }).catch(() => {});
    return apiError("ACCOUNT_LOCKED", "บัญชีถูกล็อคชั่วคราว กรุณาลองใหม่ภายหลัง", 403);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    signInAttemptLimiter.record(user.id);
    logAuthEvent("auth.blocked", user.id, { ipAddress: ctx.ip, userAgent: ctx.userAgent, reason: "Invalid password" }).catch(() => {});
    return apiError("INVALID_CREDENTIALS", "อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
  }

  if (user.isDisabled) {
    signInAttemptLimiter.record(user.id);
    logAuthEvent("auth.blocked", user.id, { ipAddress: ctx.ip, userAgent: ctx.userAgent, reason: "Account disabled" }).catch(() => {});
    return apiError("ACCOUNT_DISABLED", "บัญชีถูกระงับ กรุณาติดต่อ HR", 403);
  }

  // Employment check — only applies when called from a tenant context (x-tenant-id present)
  // Global /signin calls have no tenant context; the check is deferred to workspace selection.
  const tenantId = req.headers.get("x-tenant-id");
  if (tenantId) {
    const tp = await getTenantPrisma(tenantId);
    const emp = await tp.employee.findUnique({
      where: { userId: user.id },
      select: { employmentStatus: true },
    });
    if (emp && BLOCKED_EMPLOYMENT_STATUSES.includes(emp.employmentStatus as (typeof BLOCKED_EMPLOYMENT_STATUSES)[number])) {
      signInAttemptLimiter.record(user.id);
      logAuthEvent("auth.blocked", user.id, { ipAddress: ctx.ip, userAgent: ctx.userAgent, reason: `Employment: ${emp.employmentStatus}` }).catch(() => {});
      return apiError("EMPLOYMENT_BLOCKED", "สถานะพนักงานไม่สามารถเข้าสู่ระบบได้ กรุณาติดต่อ HR", 403);
    }
  }

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await cp.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  logAuthEvent("auth.signin", user.id, { ipAddress: ctx.ip, userAgent: ctx.userAgent }).catch(() => {});

  const response = apiOk({ mustChangePassword: user.mustChangePassword });

  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  response.cookies.set(cookieName, sessionToken, {
    path: "/",
    httpOnly: true,
    secure: isSecure,
    expires,
    sameSite: "lax",
  });

  return response;
}, { rateLimit: authEndpointLimiter });
