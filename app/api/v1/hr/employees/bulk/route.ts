import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { bulkImportEmployees } from "@/lib/employee/bulk-import-service";

export const POST = withApiHandler(async (req, ctx) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || !file.name.endsWith(".csv")) {
    return apiError("INVALID_FILE", "Please upload a CSV file", 400);
  }

  if (file.size > 1024 * 1024) {
    return apiError("FILE_TOO_LARGE", "File must be under 1MB", 400);
  }

  const csvText = await file.text();
  const result = await bulkImportEmployees(
    csvText,
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  return apiOk(result);
});
