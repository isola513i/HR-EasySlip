import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiPaginated } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { AttendanceFiltersSchema } from "@/lib/attendance/schemas";
import { getMyRecords } from "@/lib/attendance/attendance-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, AttendanceFiltersSchema);
  const { records, total, page, perPage } = await getMyRecords(
    caller.employeeId,
    filters,
  );

  return apiPaginated(records, total, page, perPage);
});
