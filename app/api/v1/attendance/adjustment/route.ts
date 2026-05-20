import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated, apiPaginated } from "@/lib/api/response";
import { parseBody, parseSearchParams } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { TimeAdjSubmitSchema, TimeAdjFiltersSchema } from "@/lib/time-adjustment/schemas";
import { submitRequest, getMyRequests } from "@/lib/time-adjustment/time-adjustment-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, TimeAdjSubmitSchema);
  const request = await submitRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiCreated(request);
}, { idempotent: true });

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, TimeAdjFiltersSchema);
  const result = await getMyRequests(caller.employeeId, filters);

  return apiPaginated(result.items, result.total, result.page, result.perPage);
});
