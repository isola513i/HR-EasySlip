import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { ConsentGrantSchema } from "@/lib/consent/schemas";
import { grantConsent } from "@/lib/consent/consent-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, ConsentGrantSchema);
  const record = await grantConsent(caller.userId, input, {
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return apiCreated(record);
});
