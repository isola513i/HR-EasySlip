import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, MANAGER_ROLES } from "@/lib/security/rbac";
import { approvalLimiter } from "@/lib/security/rate-limit";
import { OTRejectSchema } from "@/lib/overtime/schemas";
import { rejectOT } from "@/lib/overtime/overtime-approval-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, OTRejectSchema);
  const result = await rejectOT(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    input.reason,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
}, { rateLimit: approvalLimiter, rateLimitKey: "userId" });
