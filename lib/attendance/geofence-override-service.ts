// ════════════════════════════════════════════════════════════════
// Geofence Override Service
// ----------------------------------------------------------------
// When `attendance.gps.block_out_of_fence` is enabled, employees
// outside the fence cannot clock in. This service implements the
// approval flow used by clients to unblock individual clock-ins:
//
//   1. employee submits request (PENDING)
//   2. HRMG/CEO/COO/CTO decides → APPROVED or REJECTED
//   3. an APPROVED, unconsumed request lets the next clock-in
//      through; the request is then linked to the AttendanceRecord
//      so it can only be used once.
//
// Senior roles (HRMG/CEO/COO/CTO) bypass enforcement entirely; they
// don't need to file an override.
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { Role } from "@prisma/client";

export const BYPASS_ROLES: readonly Role[] = ["HRMG", "CEO", "COO", "CTO"];

export function canBypassGeofence(roles: readonly Role[]): boolean {
  return roles.some((r) => (BYPASS_ROLES as readonly Role[]).includes(r));
}

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
  // Reject if there is already a pending request — keeps the queue clean.
  const pending = await prisma.geofenceOverrideRequest.findFirst({
    where: { employeeId: input.employeeId, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    throw new DomainError(ErrorCodes.ALREADY_PROCESSED, {
      message: "A pending override request already exists",
    });
  }

  const created = await prisma.geofenceOverrideRequest.create({
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
  });

  return created;
}

export async function listPendingOverrides() {
  return prisma.geofenceOverrideRequest.findMany({
    where: { status: "PENDING" },
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

interface DecideInput {
  decision: "APPROVED" | "REJECTED";
  decisionNote?: string;
}

export async function decideOverride(
  caller: Caller,
  requestId: string,
  input: DecideInput,
  meta: RequestMeta,
) {
  return prisma.$transaction(async (tx) => {
    const req = await tx.geofenceOverrideRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (req.status !== "PENDING") {
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
        input.decision === "APPROVED"
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

/**
 * Find the latest unused APPROVED override for an employee. Returns
 * `null` if none exists. Caller must consume it (link to attendance
 * record) inside the same transaction to ensure single-use semantics.
 */
export async function findUnusedApprovedOverride(
  tx: { geofenceOverrideRequest: { findFirst: typeof prisma.geofenceOverrideRequest.findFirst } },
  employeeId: string,
) {
  return tx.geofenceOverrideRequest.findFirst({
    where: { employeeId, status: "APPROVED", attendanceRecordId: null },
    orderBy: { decidedAt: "desc" },
  });
}
