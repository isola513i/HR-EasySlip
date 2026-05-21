import { NextResponse } from "next/server";
import { z } from "zod";
import { getControlPlane } from "@/lib/db/control-plane";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { parseBody } from "@/lib/api/validate";
import { apiOk, apiError } from "@/lib/api/response";
import { hashPassword, verifyPassword } from "@/lib/auth/password-utils";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export const PUT = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { currentPassword, newPassword } = await parseBody(req, ChangePasswordSchema);
  const cp = getControlPlane();

  const user = await cp.user.findUnique({
    where: { id: caller.userId },
    select: { passwordHash: true, mustChangePassword: true },
  });

  if (!user) return apiError("USER_NOT_FOUND", "ไม่พบบัญชีผู้ใช้", 404);

  // Forced setup: skip currentPassword verification when either
  //   - mustChangePassword=true (admin forced a change; temp pw is being invalidated anyway), or
  //   - passwordHash is null (user has never set one)
  // Session authentication (magic link or temp pw) already proves identity.
  const skipCurrentCheck = user.mustChangePassword || !user.passwordHash;

  if (!skipCurrentCheck) {
    if (!currentPassword) {
      return apiError("MISSING_CURRENT_PASSWORD", "กรุณากรอกรหัสผ่านปัจจุบัน", 400);
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash!);
    if (!valid) {
      return apiError("INVALID_PASSWORD", "รหัสผ่านปัจจุบันไม่ถูกต้อง", 401);
    }
  }

  const newHash = await hashPassword(newPassword);
  await cp.user.update({
    where: { id: caller.userId },
    data: { passwordHash: newHash, mustChangePassword: false },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "user.change_password",
    entityType: "User",
    entityId: caller.userId,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk({ ok: true });
});
