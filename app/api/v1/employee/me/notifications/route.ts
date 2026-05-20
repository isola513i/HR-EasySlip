import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { NotificationPrefsSchema } from "@/lib/employee/notification-schemas";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const PREFS_SELECT = { notifyLeave: true, notifyApproval: true } as const;

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const prefs = await prisma.employee.findUnique({
    where: { id: caller.employeeId },
    select: PREFS_SELECT,
  });

  return apiOk(prefs);
});

export const PUT = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, NotificationPrefsSchema);

  const before = await prisma.employee.findUnique({
    where: { id: caller.employeeId },
    select: PREFS_SELECT,
  });

  const updated = await prisma.employee.update({
    where: { id: caller.employeeId },
    data: { notifyLeave: input.notifyLeave, notifyApproval: input.notifyApproval },
    select: PREFS_SELECT,
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "employee.notification_prefs_updated",
    entityType: "Employee",
    entityId: caller.employeeId,
    before,
    after: input,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk(updated);
});
