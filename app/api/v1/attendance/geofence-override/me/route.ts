import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { listMyOverrides } from "@/lib/attendance/geofence-override-service";

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const items = await listMyOverrides(caller.employeeId);
  return apiOk(items);
});
