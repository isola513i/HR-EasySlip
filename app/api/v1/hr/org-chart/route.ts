import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { getOrgChart } from "@/lib/hr/org-chart-service";

const ORG_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO", "MANAGER"] as const;

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(ORG_ROLES);
  if (caller instanceof NextResponse) return caller;

  const tree = await getOrgChart();
  return apiOk(tree);
});
