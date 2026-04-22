import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getDetail } from "@/lib/time-adjustment/time-adjustment-service";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const request = await getDetail(ctx.params.id);
  return apiOk(request);
});
