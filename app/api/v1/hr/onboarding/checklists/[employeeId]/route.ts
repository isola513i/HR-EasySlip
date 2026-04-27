import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { getEmployeeChecklist } from "@/lib/onboarding/checklist-service";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const checklist = await getEmployeeChecklist(ctx.params.employeeId);
  if (!checklist) return apiError("NOT_FOUND", "Checklist not found", 404);
  return apiOk(checklist);
});
