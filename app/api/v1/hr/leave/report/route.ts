import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiRoles } from "@/lib/security/rbac";
import { LeaveReportFiltersSchema } from "@/lib/leave/schemas";
import { generateReport } from "@/lib/leave/leave-report-service";

const REPORT_ROLES = ["HRMG"] as const;

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiRoles(REPORT_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, LeaveReportFiltersSchema);
  const report = await generateReport(filters);

  return apiOk(report);
});
