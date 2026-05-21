import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getDashboardData } from "@/lib/hr/dashboard-service";
import { getAttendanceTrend, getLeaveTrendByMonth } from "@/lib/hr/dashboard-trends-service";
import { getPrisma } from "@/lib/prisma";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const includeTrends = req.nextUrl.searchParams.get("include") === "trends";

  const prisma = await getPrisma();
  const data = await getDashboardData(prisma);

  if (!includeTrends) return apiOk(data);

  const [attendanceTrend, leaveTrend] = await Promise.all([
    getAttendanceTrend(30),
    getLeaveTrendByMonth(6),
  ]);

  return apiOk({ ...data, attendanceTrend, leaveTrend });
});
