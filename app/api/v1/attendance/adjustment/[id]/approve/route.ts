import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiEmployee, MANAGER_ROLES } from "@/lib/security/rbac";
import { approveRequest } from "@/lib/time-adjustment/time-adjustment-approval-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (_req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(MANAGER_ROLES);
  if (caller instanceof NextResponse) return caller;

  const result = await approveRequest(
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    ctx.params.id,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
});
