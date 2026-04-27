import { z } from "zod";
import { REPORT_TYPES, REPORT_FORMATS } from "./report-types";

export const ReportRequestSchema = z.object({
  type: z.enum(REPORT_TYPES),
  format: z.enum(REPORT_FORMATS),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departmentId: z.string().optional(),
  status: z.string().optional(),
});

export type ReportRequest = z.infer<typeof ReportRequestSchema>;
