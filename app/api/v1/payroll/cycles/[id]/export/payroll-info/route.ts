import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { generatePayrollInfoExcel } from "@/lib/payroll/payroll-info-exporter";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { buffer, filename } = await generatePayrollInfoExcel(ctx.params.id);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
