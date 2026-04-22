// ════════════════════════════════════════════════════════════════
// Attendance — Zod Schemas for request validation
// ════════════════════════════════════════════════════════════════

import { z } from "zod";

export const ClockInputSchema = z.object({
  clockType: z.enum(["IN", "OUT"]),
  workLocation: z.enum(["OFFICE", "WFH", "ON_SITE"]).default("OFFICE"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  gpsAccuracyM: z.number().min(0).optional(),
  note: z.string().max(500).optional(),
});

export const AttendanceFiltersSchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const BackfillInputSchema = z.object({
  clockType: z.enum(["IN", "OUT"]),
  clockedAt: z.string().datetime(),
  workLocation: z.enum(["OFFICE", "WFH", "ON_SITE"]).default("OFFICE"),
  reason: z.string().min(1).max(500),
});

export type ClockInput = z.infer<typeof ClockInputSchema>;
export type AttendanceFilters = z.infer<typeof AttendanceFiltersSchema>;
export type BackfillInput = z.infer<typeof BackfillInputSchema>;
