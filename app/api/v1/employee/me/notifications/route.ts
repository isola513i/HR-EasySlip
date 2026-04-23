import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { NotificationPrefsSchema } from "@/lib/employee/notification-schemas";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const prefs = await prisma.employee.findUnique({
    where: { id: caller.employeeId },
    select: { notifyLeave: true, notifyApproval: true },
  });

  return apiOk(prefs);
});

export const PUT = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, NotificationPrefsSchema);
  const employee = await prisma.employee.update({
    where: { id: caller.employeeId },
    data: {
      notifyLeave: input.notifyLeave,
      notifyApproval: input.notifyApproval,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "employee.notification_prefs_updated",
    entityType: "Employee",
    entityId: caller.employeeId,
    after: input,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiOk(employee);
});
