import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getDashboardSummary } from "@/lib/hr/dashboard-summary-service";

export const GET = withApiHandler(async () => {
  const auth = await requireApiRoles(HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  const summary = await getDashboardSummary();
  return apiOk(summary);
});
