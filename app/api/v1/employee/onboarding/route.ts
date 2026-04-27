import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { getEmployeeChecklist } from "@/lib/onboarding/checklist-service";

export const GET = withApiHandler(async () => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const checklist = await getEmployeeChecklist(caller.employeeId);
  return apiOk(checklist);
});
