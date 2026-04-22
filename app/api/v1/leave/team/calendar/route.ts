import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, MANAGER_ROLES } from "@/lib/security/rbac";
import { TeamCalendarSchema } from "@/lib/leave/schemas";
import { getTeamCalendar } from "@/lib/leave/leave-approval-service";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const { month, year } = parseSearchParams(req, TeamCalendarSchema);
  const calendar = await getTeamCalendar(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    month,
    year,
  );

  return apiOk(calendar);
});
