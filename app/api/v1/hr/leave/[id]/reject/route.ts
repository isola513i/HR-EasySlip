import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { rejectLeaveRequest } from "@/lib/leave/leave-approval-service";

const RejectSchema = z.object({ reason: z.string().min(1).max(500) });

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { reason } = await parseBody(req, RejectSchema);
  const updated = await rejectLeaveRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    reason,
    { ip: ctx.ip, userAgent: ctx.userAgent },
    { hrOverride: true },
  );

  return apiOk(updated);
});
