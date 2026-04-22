// ════════════════════════════════════════════════════════════════
// Time Adjustment — Zod Schemas
// ════════════════════════════════════════════════════════════════

import { z } from "zod";

export const TimeAdjSubmitSchema = z.object({
  clockType: z.enum(["IN", "OUT"]),
  requestedAt: z.string().datetime(),
  reason: z.string().min(1).max(500),
  attachmentUrl: z.string().url().optional(),
});

export const TimeAdjRejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const TimeAdjFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export type TimeAdjSubmit = z.infer<typeof TimeAdjSubmitSchema>;
export type TimeAdjReject = z.infer<typeof TimeAdjRejectSchema>;
export type TimeAdjFilters = z.infer<typeof TimeAdjFiltersSchema>;
