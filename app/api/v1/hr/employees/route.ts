import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiPaginated, apiCreated } from "@/lib/api/response";
import { parseBody, parseSearchParams } from "@/lib/api/validate";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import {
  EmployeeListFiltersSchema,
  EmployeeCreateSchema,
} from "@/lib/employee/schemas";
import { listEmployees, createEmployee } from "@/lib/employee/employee-service";
import { maskEmployeeList } from "@/lib/security/sensitive-mask";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";
import { IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, EmployeeListFiltersSchema);
  const result = await listEmployees(filters, {
    userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles,
  });

  // Middleware doesn't run for /api/* paths, so check the cookie directly
  const isImpersonating = !!req.cookies.get(IMPERSONATION_COOKIE)?.value;
  const items = isImpersonating ? maskEmployeeList(result.items) : result.items;

  return apiPaginated(items, result.total, result.page, result.perPage);
});

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, EmployeeCreateSchema);
  const employee = await createEmployee(
    input,
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiCreated(employee);
});
