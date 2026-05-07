import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { requireApiRoles } from "@/lib/security/rbac";
import { listCashouts } from "@/lib/payroll/cashout-service";

const CASHOUT_ROLES = ["HRMG", "HR_AUTHORIZED", "CEO", "CTO", "COO"] as const;

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(CASHOUT_ROLES);
  if (caller instanceof NextResponse) return caller;

  const year = Number(ctx.params.year);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: { code: "INVALID_YEAR" } }, { status: 400 });
  }

  const items = await listCashouts(year);
  return apiOk(items);
});
