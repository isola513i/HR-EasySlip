import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiPaginated } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { LeaveFiltersSchema } from "@/lib/leave/schemas";
import { getMyLeaveRequests } from "@/lib/leave/leave-query-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const filters = parseSearchParams(req, LeaveFiltersSchema);
  const result = await getMyLeaveRequests(caller.employeeId, filters);

  return apiPaginated(result.items, result.total, result.page, result.perPage);
});
