import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { writeAuditLog } from "@/lib/audit/logger";
import { generateEmpeoTemplateExcel } from "@/lib/payroll/empeo-template-exporter";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const { buffer, filename } = await generateEmpeoTemplateExcel(ctx.params.id);

  await writeAuditLog({
    actorId: caller.userId,
    action: "export.empeo_template",
    entityType: "PayrollCycle",
    entityId: ctx.params.id,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
