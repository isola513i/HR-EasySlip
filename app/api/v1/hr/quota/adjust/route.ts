import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { QuotaAdjustSchema } from "@/lib/leave/schemas";
import { adjustQuota } from "@/lib/leave/leave-quota-service";

const ADJUST_ROLES = ["HRMG"] as const;

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(ADJUST_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, QuotaAdjustSchema);
  const result = await adjustQuota(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
});
