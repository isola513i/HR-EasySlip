// ════════════════════════════════════════════════════════════════
// Payroll — Zod Schemas
// ════════════════════════════════════════════════════════════════

import { z } from "zod";

export const CycleListSchema = z.object({
  year: z.coerce.number().int().optional(),
  status: z.enum(["OPEN", "LOCKED", "EXPORTED"]).optional(),
});

export const TimestampExportSchema = z.object({
  format: z.enum(["csv", "xlsx"]).default("csv"),
});
