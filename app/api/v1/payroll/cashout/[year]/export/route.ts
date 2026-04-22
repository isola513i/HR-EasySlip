import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiRoles } from "@/lib/security/rbac";
import { exportCashout } from "@/lib/payroll/cashout-service";

const EXPORT_ROLES = ["HR_AUTHORIZED"] as const;

export const POST = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(EXPORT_ROLES);
  if (caller instanceof NextResponse) return caller;

  const year = Number(ctx.params.year);
  const csv = await exportCashout(year);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cashout-${year}.csv"`,
    },
  });
});
