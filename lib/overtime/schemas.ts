// ════════════════════════════════════════════════════════════════
// Overtime — Zod Schemas for request validation
// ════════════════════════════════════════════════════════════════

import { z } from "zod";

export const OTSubmitWeekdaySchema = z.object({
  date: z.string().date(),
  reason: z.string().min(1).max(500),
});

export const OTSubmitHolidaySchema = z.object({
  date: z.string().date(),
  assignedStart: z.string().datetime(),
  assignedEnd: z.string().datetime(),
  reason: z.string().min(1).max(500),
  kind: z.enum(["HOLIDAY", "HOLIDAY_WORK"]).default("HOLIDAY"),
});

export const OTRejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const OTFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export type OTSubmitWeekdayInput = z.infer<typeof OTSubmitWeekdaySchema>;
export type OTSubmitHolidayInput = z.infer<typeof OTSubmitHolidaySchema>;
export type OTFilters = z.infer<typeof OTFiltersSchema>;
