import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { EmployeeUpdateSchema } from "@/lib/employee/schemas";
import {
  getEmployeeById,
  updateEmployee,
} from "@/lib/employee/employee-service";
import { maskEmployeeForImpersonation } from "@/lib/security/sensitive-mask";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";
import { IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";

export const GET = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const employee = await getEmployeeById(ctx.params.employeeId, {
    userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles,
  });

  // Middleware doesn't run for /api/* paths, so check the cookie directly
  const isImpersonating = !!req.cookies.get(IMPERSONATION_COOKIE)?.value;
  return apiOk(isImpersonating ? maskEmployeeForImpersonation(employee) : employee);
});

export const PUT = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, EmployeeUpdateSchema);
  const employee = await updateEmployee(
    ctx.params.employeeId,
    input,
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(employee);
});
