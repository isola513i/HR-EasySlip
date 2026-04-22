import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { withdrawRequest } from "@/lib/time-adjustment/time-adjustment-service";

export const PATCH = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const result = await withdrawRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
});
