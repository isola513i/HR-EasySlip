import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { LeaveRequestSchema } from "@/lib/leave/schemas";
import { submitLeaveRequest } from "@/lib/leave/leave-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const input = await parseBody(req, LeaveRequestSchema);
  const request = await submitLeaveRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiCreated(request);
});
