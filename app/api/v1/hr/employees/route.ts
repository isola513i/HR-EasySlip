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

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, EmployeeListFiltersSchema);
  const result = await listEmployees(filters, {
    userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles,
  });

  return apiPaginated(result.items, result.total, result.page, result.perPage);
});

export const POST = withApiHandler(async (req, ctx) => {
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
