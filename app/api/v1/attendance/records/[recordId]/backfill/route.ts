import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { BackfillInputSchema } from "@/lib/attendance/schemas";
import { backfillRecord } from "@/lib/attendance/attendance-service";

const BACKFILL_ROLES = ["HRMG", "HR_AUTHORIZED"] as const;

export const PATCH = withApiHandler(async (req, ctx) => {
  const caller = await requireApiRoles(BACKFILL_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, BackfillInputSchema);
  const record = await backfillRecord(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    ctx.params.recordId,
    input,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(record);
});
