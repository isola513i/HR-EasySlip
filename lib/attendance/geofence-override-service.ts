import { Prisma, GeofenceOverrideStatus, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { isSensitiveDataRole } from "@/lib/security/role-helpers";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { GeofenceOverrideDecisionInput } from "./geofence-override-schemas";

export const canBypassGeofence = (roles: readonly Role[]): boolean => isSensitiveDataRole(roles);

interface CreateInput {
  employeeId: string;
  reason: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
}

export async function createOverrideRequest(
  caller: Caller,
  input: CreateInput,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const pending = await tx.geofenceOverrideRequest.findFirst({
      where: { employeeId: input.employeeId, status: GeofenceOverrideStatus.PENDING },
      select: { id: true },
    });
    if (pending) {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { reason: "PENDING_EXISTS" });
    }

    const created = await tx.geofenceOverrideRequest.create({
      data: {
        employeeId: input.employeeId,
        reason: input.reason,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        distanceMeters: input.distanceMeters ?? null,
      },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "geofence.override_requested",
      entityType: "GeofenceOverrideRequest",
      entityId: created.id,
      after: created,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return created;
  });
}

export async function listPendingOverrides() {
  return prisma.geofenceOverrideRequest.findMany({
    where: { status: GeofenceOverrideStatus.PENDING },
    include: {
      employee: {
        select: { id: true, employeeCode: true, firstNameTh: true, lastNameTh: true },
      },
    },
    orderBy: { requestedAt: "asc" },
  });
}

export async function listMyOverrides(employeeId: string, limit = 20) {
  return prisma.geofenceOverrideRequest.findMany({
    where: { employeeId },
    orderBy: { requestedAt: "desc" },
    take: limit,
  });
}

export async function decideOverride(
  caller: Caller,
  requestId: string,
  input: GeofenceOverrideDecisionInput,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const req = await tx.geofenceOverrideRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (req.status !== GeofenceOverrideStatus.PENDING) {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: req.status });
    }

    const updated = await tx.geofenceOverrideRequest.update({
      where: { id: requestId },
      data: {
        status: input.decision,
        decidedById: caller.employeeId,
        decidedAt: new Date(),
        decisionNote: input.decisionNote ?? null,
      },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action:
        input.decision === GeofenceOverrideStatus.APPROVED
          ? "geofence.override_approved"
          : "geofence.override_rejected",
      entityType: "GeofenceOverrideRequest",
      entityId: requestId,
      before: req,
      after: updated,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}

// Single-use semantics enforced by AttendanceRecord.id @unique on the join column —
// the unique constraint catches double-spend even outside Serializable.
export async function findUnusedApprovedOverride(
  tx: Prisma.TransactionClient,
  employeeId: string,
) {
  return tx.geofenceOverrideRequest.findFirst({
    where: {
      employeeId,
      status: GeofenceOverrideStatus.APPROVED,
      attendanceRecordId: null,
    },
    orderBy: { decidedAt: "desc" },
  });
}
