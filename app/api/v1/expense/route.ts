import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiCreated } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { ExpenseCreateSchema } from "@/lib/expense/schemas";
import { createExpenseClaim } from "@/lib/expense/expense-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, ExpenseCreateSchema);
  const claim = await createExpenseClaim(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiCreated(claim);
});
