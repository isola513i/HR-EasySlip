import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, MANAGER_ROLES } from "@/lib/security/rbac";
import { TimeAdjRejectSchema } from "@/lib/time-adjustment/schemas";
import { rejectRequest } from "@/lib/time-adjustment/time-adjustment-approval-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, TimeAdjRejectSchema);
  const result = await rejectRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
});
