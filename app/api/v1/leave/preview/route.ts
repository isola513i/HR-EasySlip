import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { LeavePreviewSchema } from "@/lib/leave/schemas";
import { previewLeave } from "@/lib/leave/leave-query-service";

export const POST = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, LeavePreviewSchema);
  const preview = await previewLeave(caller.employeeId, input);

  return apiOk(preview);
});
