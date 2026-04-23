import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getConsentStatus } from "@/lib/consent/consent-service";

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const status = await getConsentStatus(caller.userId);
  return apiOk(status);
});
