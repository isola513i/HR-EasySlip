import { z } from "zod";
import { GeofenceOverrideStatus } from "@prisma/client";

export const GeofenceOverrideRequestSchema = z.object({
  reason: z.string().min(5).max(500),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  distanceMeters: z.number().int().min(0).max(1_000_000).optional(),
});

export const GeofenceOverrideDecisionSchema = z.object({
  decision: z.enum([GeofenceOverrideStatus.APPROVED, GeofenceOverrideStatus.REJECTED]),
  decisionNote: z.string().max(500).optional(),
});

export type GeofenceOverrideRequestInput = z.infer<typeof GeofenceOverrideRequestSchema>;
export type GeofenceOverrideDecisionInput = z.infer<typeof GeofenceOverrideDecisionSchema>;
