import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { getTeamRecords } from "@/lib/attendance/attendance-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const date = req.nextUrl.searchParams.get("date");
  if (!date) return apiError("MISSING_PARAM", "date is required", 400);

  const departmentId = req.nextUrl.searchParams.get("departmentId") ?? undefined;
  const records = await getTeamRecords(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    date,
    departmentId,
  );

  return apiOk(records);
});
