import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { getPdpaOverview } from "@/lib/consent/pdpa-overview-service";

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const overview = await getPdpaOverview();
  return apiOk(overview);
});
