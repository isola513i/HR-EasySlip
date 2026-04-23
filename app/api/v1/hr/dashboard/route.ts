import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getDashboardData } from "@/lib/hr/dashboard-service";

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const data = await getDashboardData();
  return apiOk(data);
});
