import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { hrRejectOT } from "@/lib/overtime/overtime-approval-service";

const RejectSchema = z.object({ reason: z.string().min(1).max(500) });

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { reason } = await parseBody(req, RejectSchema);
  const updated = await hrRejectOT(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    reason,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(updated);
});
