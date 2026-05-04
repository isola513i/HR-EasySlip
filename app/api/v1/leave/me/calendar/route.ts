import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { TeamCalendarSchema } from "@/lib/leave/schemas";
import { getEmployeeCalendar } from "@/lib/leave/leave-query-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { month, year } = parseSearchParams(req, TeamCalendarSchema);
  const data = await getEmployeeCalendar(caller.employeeId, month, year);
  return apiOk(data);
});
