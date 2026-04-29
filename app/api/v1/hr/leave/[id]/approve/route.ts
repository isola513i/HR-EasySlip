import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { approveLeaveRequest } from "@/lib/leave/leave-approval-service";

export const POST = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const updated = await approveLeaveRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    { ip: ctx.ip, userAgent: ctx.userAgent },
    { hrOverride: true },
  );

  return apiOk(updated);
});
