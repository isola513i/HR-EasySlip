import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { requireApiRoles, HR_ROLES } from "@/lib/security/rbac";
import { generateEmployeeDataExcel } from "@/lib/payroll/employee-data-exporter";

export const GET = withApiHandler(async () => {
  const caller = await requireApiRoles(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const buffer = await generateEmployeeDataExcel();
  const dd = String(new Date().getDate()).padStart(2, "0");
  const mm = String(new Date().getMonth() + 1).padStart(2, "0");
  const yyyy = new Date().getFullYear();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Employee_Data_Template_${dd}${mm}${yyyy}.xlsx"`,
    },
  });
});
