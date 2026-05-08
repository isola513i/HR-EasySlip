import type { Prisma, Role } from "@prisma/client";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import {
  canBypassGeofence,
  findUnusedApprovedOverride,
} from "./geofence-override-service";
import type { GeofenceEvaluation } from "./geofence";

const TAG_OUT = "[OUT_OF_GEOFENCE]";
const TAG_BYPASS = "[GEOFENCE_BYPASS_ROLE]";
const TAG_OVERRIDE = "[GEOFENCE_OVERRIDE_APPROVED]";

export interface GeofenceClockResolution {
  noteTag: string;
  usedOverrideId: string | null;
}

export function annotateNote(original: string | undefined, ...tags: string[]): string {
  const prefix = tags.filter(Boolean).join(" ");
  return original ? `${prefix} ${original}` : prefix;
}

export function clockAuditAction(
  clockType: string,
  isOutOfFence: boolean,
  hadOverride: boolean,
): string {
  const base = `attendance.clock_${clockType.toLowerCase()}`;
  if (!isOutOfFence) return base;
  return `${base}.${hadOverride ? "geofence_override" : "out_of_geofence"}`;
}

export function buildDistanceTag(geofence: GeofenceEvaluation, isOutOfFence: boolean): string {
  if (!isOutOfFence) return "";
  return `${TAG_OUT} ~${geofence.distanceMeters}m / max ${geofence.config.radiusMeters}m`;
}

export async function resolveGeofenceClock(
  tx: Prisma.TransactionClient,
  employeeId: string,
  callerRoles: readonly Role[],
  geofence: GeofenceEvaluation,
  isOutOfFence: boolean,
): Promise<GeofenceClockResolution> {
  const enforcing = isOutOfFence && geofence.config.blockOutOfFence;
  if (!enforcing) return { noteTag: "", usedOverrideId: null };

  if (canBypassGeofence(callerRoles)) {
    return { noteTag: TAG_BYPASS, usedOverrideId: null };
  }

  const override = await findUnusedApprovedOverride(tx, employeeId);
  if (!override) {
    throw new DomainError(
      ErrorCodes.GEOFENCE_BLOCKED,
      {
        distanceMeters: geofence.distanceMeters,
        radiusMeters: geofence.config.radiusMeters,
      },
      403,
    );
  }
  return { noteTag: TAG_OVERRIDE, usedOverrideId: override.id };
}
