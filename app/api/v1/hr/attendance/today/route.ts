import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getTodayAttendance } from "@/lib/hr/attendance-dashboard-service";

const QuerySchema = z.object({ date: z.string().date() });

export const GET = withApiHandler(async (req) => {
  const auth = await requireApiRoles(HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  const { date } = parseSearchParams(req, QuerySchema);
  const rows = await getTodayAttendance(new Date(date));
  return apiOk(rows);
});
