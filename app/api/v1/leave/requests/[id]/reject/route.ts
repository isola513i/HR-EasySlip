import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, MANAGER_ROLES } from "@/lib/security/rbac";
import { approvalLimiter } from "@/lib/security/rate-limit";
import { LeaveRejectSchema } from "@/lib/leave/schemas";
import { rejectLeaveRequest } from "@/lib/leave/leave-approval-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, LeaveRejectSchema);
  const result = await rejectLeaveRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    input.reason,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
}, { rateLimit: approvalLimiter, rateLimitKey: "userId" });
