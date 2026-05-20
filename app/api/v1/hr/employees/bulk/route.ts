import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk, apiError } from "@/lib/api/response";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { bulkImportEmployees } from "@/lib/employee/bulk-import-service";
import { bulkImportEmpeoXlsx } from "@/lib/employee/bulk-import-empeo";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

const MAX_BYTES = 5 * 1024 * 1024;

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const dryRun = formData.get("dryRun") === "true";
  if (!file) return apiError("INVALID_FILE", "Missing file", 400);
  if (file.size > MAX_BYTES) return apiError("FILE_TOO_LARGE", "File must be under 5MB", 400);

  const callerObj = { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles };
  const meta = { ip: ctx.ip, userAgent: ctx.userAgent };

  if (file.name.endsWith(".xlsx")) {
    const buffer = await file.arrayBuffer();
    const result = await bulkImportEmpeoXlsx(buffer, callerObj, meta, { dryRun });
    return apiOk(result);
  }
  if (file.name.endsWith(".csv")) {
    const csvText = await file.text();
    const result = await bulkImportEmployees(csvText, callerObj, meta);
    return apiOk(result);
  }
  return apiError("INVALID_FILE", "Upload .csv or .xlsx", 400);
});
