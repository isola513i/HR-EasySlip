import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { finalizeCycle } from "@/lib/attendance/attendance-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const FINALIZE_ROLES = ["HRMG"] as const;

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiRoles(FINALIZE_ROLES);
  if (caller instanceof NextResponse) return caller;

  const cycle = await finalizeCycle(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(cycle);
});
