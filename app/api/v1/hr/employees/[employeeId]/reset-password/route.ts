import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getControlPlane } from "@/lib/db/control-plane";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { hashPassword, generateTempPassword } from "@/lib/auth/password-utils";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (_req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const employeeId = ctx.params.employeeId as string;

  // Employee lookup stays in tenant DB
  const prisma = await getPrisma();
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, employeeCode: true },
  });

  if (!employee) {
    return apiError("NOT_FOUND", "ไม่พบพนักงาน", 404);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const cp = getControlPlane();

  await cp.user.update({
    where: { id: employee.userId },
    data: { passwordHash, mustChangePassword: true },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "user.reset_password",
    entityType: "User",
    entityId: employee.userId,
    reason: `HR reset password for ${employee.employeeCode}`,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk({ tempPassword, employeeCode: employee.employeeCode });
});
