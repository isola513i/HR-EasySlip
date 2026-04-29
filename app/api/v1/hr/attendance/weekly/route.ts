import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getWeeklyAttendance } from "@/lib/hr/attendance-dashboard-service";

const QuerySchema = z.object({ weekStart: z.string().date() });

export const GET = withApiHandler(async (req) => {
  const auth = await requireApiRoles(HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  const { weekStart } = parseSearchParams(req, QuerySchema);
  const data = await getWeeklyAttendance(new Date(weekStart));
  return apiOk(data);
});
