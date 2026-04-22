import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { lockCycle } from "@/lib/payroll/payroll-service";

const LOCK_ROLES = ["HRMG", "CEO", "CTO", "COO"] as const;

export const POST = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(LOCK_ROLES);
  if (caller instanceof NextResponse) return caller;

  const result = await lockCycle(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    ctx.params.id,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
});
