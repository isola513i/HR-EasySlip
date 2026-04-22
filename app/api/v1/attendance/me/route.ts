import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiPaginated } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { AttendanceFiltersSchema } from "@/lib/attendance/schemas";
import { getMyRecords } from "@/lib/attendance/attendance-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const filters = parseSearchParams(req, AttendanceFiltersSchema);
  const { records, total, page, perPage } = await getMyRecords(
    caller.employeeId,
    filters,
  );

  return apiPaginated(records, total, page, perPage);
});
