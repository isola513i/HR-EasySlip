import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { withdrawLeaveRequest } from "@/lib/leave/leave-service";

export const PATCH = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const result = await withdrawLeaveRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
});
