import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { activateCycle } from "@/lib/reviews/cycle-service";

const HR_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

export const POST = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;
  const result = await activateCycle(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    ctx.params.id,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );
  return apiOk(result);
});
