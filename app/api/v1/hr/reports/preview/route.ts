import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { apiOk } from "@/lib/api/response";
import { parseSearchParams } from "@/lib/api/validate";
import { requireApiEmployee, HR_ROLES } from "@/lib/security/rbac";
import { REPORT_TYPES } from "@/lib/reports/report-types";
import { getReportPreview } from "@/lib/reports/report-preview-service";

const PreviewSchema = z.object({
  type: z.enum(REPORT_TYPES),
  dateFrom: z.string().date(),
  dateTo: z.string().date(),
  departmentId: z.string().optional(),
});

export const GET = withApiHandler(async (req) => {
  const caller = await requireApiEmployee(HR_ROLES);
  if (caller instanceof NextResponse) return caller;

  const filters = parseSearchParams(req, PreviewSchema);
  const preview = await getReportPreview(filters.type, {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    departmentId: filters.departmentId,
  });
  return apiOk(preview);
});
