import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { grantConsent } from "@/lib/consent/consent-service";

export const POST = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const record = await grantConsent(caller.userId, {
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiCreated(record);
});
