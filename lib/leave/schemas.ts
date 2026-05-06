// ════════════════════════════════════════════════════════════════
// Leave — Zod Schemas for request validation
// ════════════════════════════════════════════════════════════════

import { z } from "zod";

const LeaveTypeEnum = z.enum([
  "SICK",
  "PERSONAL",
  "ANNUAL",
  "LEAVE_WITHOUT_PAY",
  "MATERNITY",
  "PATERNITY",
  "CHILD_CARE",
  "ORDINATION",
  "MILITARY",
  "FUNERAL",
  "TRAINING",
]);

export const LeaveRequestSchema = z.object({
  leaveType: LeaveTypeEnum,
  startDate: z.string().date(),
  endDate: z.string().date(),
  halfDay: z.enum(["FULL", "MORNING", "AFTERNOON"]).default("FULL"),
  reason: z.string().min(1).max(1000),
});

export const LeavePreviewSchema = z.object({
  leaveType: LeaveTypeEnum,
  startDate: z.string().date(),
  endDate: z.string().date(),
  halfDay: z.enum(["FULL", "MORNING", "AFTERNOON"]).default("FULL"),
});

export const LeaveFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "CANCELLED", "WITHDRAWN"])
    .optional(),
  leaveType: LeaveTypeEnum.optional(),
  year: z.coerce.number().int().optional(),
});

export const LeaveRejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const BulkDecisionSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().max(500).optional(),
});

export const QuotaAdjustSchema = z.object({
  employeeId: z.string(),
  leaveType: LeaveTypeEnum,
  quotaYear: z.number().int(),
  adjustDays: z.number(),
  reason: z.string().min(1).max(500),
});

export const LeaveReportFiltersSchema = z.object({
  year: z.coerce.number().int(),
  leaveType: LeaveTypeEnum.optional(),
  departmentId: z.string().optional(),
});

export const TeamCalendarSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
});

export type LeaveRequestInput = z.infer<typeof LeaveRequestSchema>;
export type LeavePreviewInput = z.infer<typeof LeavePreviewSchema>;
export type LeaveFilters = z.infer<typeof LeaveFiltersSchema>;
