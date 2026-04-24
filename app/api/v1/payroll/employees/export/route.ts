import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { writeAuditLog } from "@/lib/audit/logger";
import { generateEmployeeDataExcel } from "@/lib/payroll/employee-data-exporter";

export const GET = withApiHandler(async (_req, ctx) => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const buffer = await generateEmployeeDataExcel();

  await writeAuditLog({
    actorId: caller.userId,
    action: "export.employee_data",
    entityType: "Employee",
    entityId: "bulk",
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Employee_Data_Template_${dd}${mm}${now.getFullYear()}.xlsx"`,
    },
  });
});
