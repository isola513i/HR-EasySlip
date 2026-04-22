import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getLeaveRequestDetail } from "@/lib/leave/leave-query-service";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const request = await getLeaveRequestDetail(ctx.params.id, {
    employeeId: caller.employeeId!,
    roles: caller.roles,
  });
  return apiOk(request);
});
