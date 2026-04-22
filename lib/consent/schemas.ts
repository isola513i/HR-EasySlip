// ════════════════════════════════════════════════════════════════
// Consent — Zod Schemas
// ════════════════════════════════════════════════════════════════

import { z } from "zod";

export const ConsentGrantSchema = z.object({
  purpose: z.string().min(1).max(100),
  version: z.string().min(1).max(20),
});

export type ConsentGrantInput = z.infer<typeof ConsentGrantSchema>;
