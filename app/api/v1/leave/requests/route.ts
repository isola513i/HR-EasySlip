import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { leaveRequestLimiter } from "@/lib/security/rate-limit";
import { LeaveRequestSchema } from "@/lib/leave/schemas";
import { submitLeaveRequest } from "@/lib/leave/leave-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, LeaveRequestSchema);
  const result = await submitLeaveRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiCreated(result);
}, { rateLimit: leaveRequestLimiter, rateLimitKey: "userId", idempotent: true });
