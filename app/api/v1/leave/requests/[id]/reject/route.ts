import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { LeaveRejectSchema } from "@/lib/leave/schemas";
import { rejectLeaveRequest } from "@/lib/leave/leave-approval-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const input = await parseBody(req, LeaveRejectSchema);
  const result = await rejectLeaveRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    input.reason,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
});
