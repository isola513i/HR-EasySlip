import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated, apiPaginated } from "@/lib/api/response";
import { parseBody, parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { TimeAdjSubmitSchema, TimeAdjFiltersSchema } from "@/lib/time-adjustment/schemas";
import { submitRequest, getMyRequests } from "@/lib/time-adjustment/time-adjustment-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const input = await parseBody(req, TimeAdjSubmitSchema);
  const request = await submitRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiCreated(request);
});

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const filters = parseSearchParams(req, TimeAdjFiltersSchema);
  const result = await getMyRequests(caller.employeeId, filters);

  return apiPaginated(result.items, result.total, result.page, result.perPage);
});
