import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { parseBody } from "@/lib/api/validate";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { ReportRequestSchema } from "@/lib/reports/report-schema";
import { generateReport } from "@/lib/reports/report-builder-service";
import { requireApiMutable } from "@/lib/auth/impersonation-guard";

export const POST = withApiHandler(async (req, ctx) => {
  const guard = await requireApiMutable();
  if (guard) return guard;

  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const input = await parseBody(req, ReportRequestSchema);
  const result = await generateReport(
    input.type,
    { dateFrom: input.dateFrom, dateTo: input.dateTo, departmentId: input.departmentId, status: input.status },
    input.format,
    { userId: caller.userId, employeeId: caller.employeeId, roles: caller.roles },
    { ip: ctx.ip, userAgent: ctx.userAgent },
  );

  const body = typeof result.buffer === "string" ? result.buffer : new Uint8Array(result.buffer);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
});
