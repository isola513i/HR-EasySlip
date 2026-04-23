// ════════════════════════════════════════════════════════════════
// Audit — Zod Schemas
// ════════════════════════════════════════════════════════════════

import { z } from "zod";

export const AuditQuerySchema = z.object({
  entityType: z.string().optional(),
  actorId: z.string().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export type AuditQuery = z.infer<typeof AuditQuerySchema>;

export const AuditTimelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export type AuditTimelineQuery = z.infer<typeof AuditTimelineQuerySchema>;
