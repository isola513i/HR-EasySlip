import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, MANAGER_ROLES } from "@/lib/security/rbac";
import { approvalLimiter } from "@/lib/security/rate-limit";
import { ExpenseDecisionSchema } from "@/lib/expense/schemas";
import { decideExpenseClaim } from "@/lib/expense/expense-service";

export const PATCH = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, ExpenseDecisionSchema);
  const updated = await decideExpenseClaim(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiOk(updated);
}, { rateLimit: approvalLimiter, rateLimitKey: "userId" });
