import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, MANAGER_ROLES } from "@/lib/security/rbac";
import { approvalLimiter } from "@/lib/security/rate-limit";
import { BulkDecisionSchema } from "@/lib/leave/schemas";
import { bulkDecision } from "@/lib/leave/leave-approval-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, BulkDecisionSchema);
  const results = await bulkDecision(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    input.ids,
    input.decision,
    input.reason,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(results);
}, { rateLimit: approvalLimiter, rateLimitKey: "userId" });
