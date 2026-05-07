import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { markCashoutExported } from "@/lib/payroll/cashout-service";

const CASHOUT_ROLES = ["HRMG", "CEO", "CTO", "COO"] as const;

export const POST = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(CASHOUT_ROLES);
  if (caller instanceof NextResponse) return caller;

  const result = await markCashoutExported(
    { userId: caller.userId, employeeId: caller.employeeId!, roles: caller.roles },
    ctx.params.id,
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
});
