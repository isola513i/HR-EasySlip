import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { withdrawConsent } from "@/lib/consent/consent-service";

export const POST = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const result = await withdrawConsent(caller.userId, {
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  if (!result) {
    return apiError("NO_ACTIVE_CONSENT", "No active consent to withdraw", 404);
  }

  return apiOk(result);
});
