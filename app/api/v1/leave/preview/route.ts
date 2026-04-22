import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { LeavePreviewSchema } from "@/lib/leave/schemas";
import { previewLeave } from "@/lib/leave/leave-service";

export const POST = withApiHandler(async (req) => {
  const caller = await requireApiRoles(EMPLOYEE_ROLES);
  if (caller instanceof NextResponse) return caller;
  if (!caller.employeeId) {
    return NextResponse.json({ ok: false, error: "No employee record" }, { status: 403 });
  }

  const input = await parseBody(req, LeavePreviewSchema);
  const preview = await previewLeave(caller.employeeId, input);

  return apiOk(preview);
});
