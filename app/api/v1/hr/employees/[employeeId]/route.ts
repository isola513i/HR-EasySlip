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

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const employee = await getEmployeeById(ctx.params.employeeId);
  return apiOk(employee);
});

export const PUT = withApiHandler(async (req, ctx) => {
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
