export const REPORT_TYPES = ["ATTENDANCE_SUMMARY", "LEAVE_SUMMARY", "EMPLOYEE_DIRECTORY", "OT_SUMMARY"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_FORMATS = ["CSV", "EXCEL"] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  departmentId?: string;
  status?: string;
}

export interface ReportResult {
  buffer: Buffer | string;
  filename: string;
  contentType: string;
}
