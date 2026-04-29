import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getLeaveTrendByMonth } from "@/lib/hr/dashboard-trends-service";

export const GET = withApiHandler(async () => {
  const auth = await requireApiRoles(HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  const data = await getLeaveTrendByMonth(6);
  return apiOk(data);
});
