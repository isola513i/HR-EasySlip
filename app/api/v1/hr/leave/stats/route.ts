import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getOrgLeaveStats } from "@/lib/leave/leave-org-stats-service";
import { getPrisma } from "@/lib/prisma";

export const GET = withApiHandler(async () => {
  const auth = await requireApiRoles(HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  const prisma = await getPrisma();
  const stats = await getOrgLeaveStats(prisma);
  return apiOk(stats);
});
