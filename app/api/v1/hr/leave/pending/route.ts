import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getAllPendingLeaves } from "@/lib/leave/leave-org-stats-service";

export const GET = withApiHandler(async () => {
  const auth = await requireApiRoles(HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  const rows = await getAllPendingLeaves();
  return apiOk(rows);
});
