import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, MANAGER_ROLES, HR_ROLES } from "@/lib/security/rbac";
import { ExpenseDecisionSchema } from "@/lib/expense/schemas";
import { decideExpenseClaim } from "@/lib/expense/expense-service";

export const PATCH = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, ExpenseDecisionSchema);
  const isHR = caller.roles.some((r) => HR_ROLES.includes(r));
  const updated = await decideExpenseClaim(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
    { hrOverride: isHR },
  );
  return apiOk(updated);
});
