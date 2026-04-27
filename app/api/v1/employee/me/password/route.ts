import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { parseBody } from "@/lib/api/validate";
import { apiOk, apiError } from "@/lib/api/response";
import { hashPassword, verifyPassword } from "@/lib/auth/password-utils";
import { writeAuditLog } from "@/lib/audit/logger";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
  newPassword: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export const PUT = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { currentPassword, newPassword } = await parseBody(req, ChangePasswordSchema);

  const user = await prisma.user.findUnique({
    where: { id: caller.userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return apiError("NO_PASSWORD", "บัญชีนี้ไม่มีรหัสผ่าน ใช้ Magic Link แทน", 400);
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return apiError("INVALID_PASSWORD", "รหัสผ่านปัจจุบันไม่ถูกต้อง", 401);
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
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
