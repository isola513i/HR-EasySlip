import { writeAuditLog } from "@/lib/audit/logger";
import { generateAttendanceReport } from "./attendance-report";
import { generateLeaveReport } from "./leave-report";
import { generateEmployeeReport } from "./employee-report";
import { generateOTReport } from "./ot-report";
import { formatAsExcel, formatAsCSV } from "./report-formatter";
import type { ReportType, ReportFormat, ReportFilters, ReportResult } from "./report-types";
import type { Caller, RequestMeta } from "@/lib/api/types";

const generators: Record<ReportType, (f: ReportFilters) => Promise<{ headers: string[]; rows: (string | number)[][]; sheetName: string }>> = {
  ATTENDANCE_SUMMARY: generateAttendanceReport,
  LEAVE_SUMMARY: generateLeaveReport,
  EMPLOYEE_DIRECTORY: generateEmployeeReport,
  OT_SUMMARY: generateOTReport,
};

export async function generateReport(
  type: ReportType,
  filters: ReportFilters,
  format: ReportFormat,
  caller: Caller,
  meta: RequestMeta,
): Promise<ReportResult> {
  const { headers, rows, sheetName } = await generators[type](filters);

  await writeAuditLog({
    actorId: caller.userId,
    action: "export.report",
    entityType: "Report",
    entityId: type,
    after: { type, format, filters, rowCount: rows.length },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  if (format === "EXCEL") {
    const buffer = await formatAsExcel(headers, rows, sheetName);
    return {
      buffer,
      filename: `${sheetName.toLowerCase()}-report.xlsx`,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  const csv = formatAsCSV(headers, rows);
  return {
    buffer: csv,
    filename: `${sheetName.toLowerCase()}-report.csv`,
    contentType: "text/csv; charset=utf-8",
  };
}
