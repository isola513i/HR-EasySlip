import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getEmployeeTimesheet } from "@/lib/attendance/timesheet-service";

const TimesheetFiltersSchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
});

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, TimesheetFiltersSchema);
  const result = await getEmployeeTimesheet(caller.employeeId, filters.from, filters.to);
  return apiOk(result);
});
