// ════════════════════════════════════════════════════════════════
// Attendance Service — business logic for clock, records, backfill
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { assertCycleOpen } from "@/lib/api/cycle-guard";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { ClockInput, AttendanceFilters, BackfillInput } from "./schemas";
import { getBangkokDayBounds, validateClockAction } from "./clock-validation";
import { isSensitiveDataRole } from "@/lib/security/role-helpers";
import { evaluateGeofence, type GeofenceEvaluation } from "./geofence";
import {
  canBypassGeofence,
  findUnusedApprovedOverride,
} from "./geofence-override-service";
import { loadAttendancePolicy } from "./policy";

interface ClockMeta extends RequestMeta {
  deviceId?: string;
}

const GEOFENCE_TAG = "[OUT_OF_GEOFENCE]";
const GEOFENCE_BYPASS_TAG = "[GEOFENCE_BYPASS_ROLE]";
const GEOFENCE_OVERRIDE_TAG = "[GEOFENCE_OVERRIDE_APPROVED]";

function annotateNote(original: string | undefined, ...tags: string[]): string {
  const prefix = tags.filter(Boolean).join(" ");
  return original ? `${prefix} ${original}` : prefix;
}

export async function clockInOut(
  caller: Caller,
  input: ClockInput,
  meta: ClockMeta,
) {
  const clockedAt = new Date();
  await assertCycleOpen(clockedAt, caller.roles);

  const { todayStart, todayEnd } = getBangkokDayBounds(clockedAt);

  // Drop GPS coords entirely when capture is disabled by org policy.
  const policy = await loadAttendancePolicy();
  const lat = policy.gpsCaptureEnabled ? input.latitude : undefined;
  const lng = policy.gpsCaptureEnabled ? input.longitude : undefined;
  const acc = policy.gpsCaptureEnabled ? input.gpsAccuracyM : undefined;

  // Geofence: evaluation always runs when enforce is on. The block flag
  // controls whether out-of-fence requests fail outright. Senior roles
  // (HRMG/CEO/COO/CTO) bypass the block; everyone else needs an
  // APPROVED, unused GeofenceOverrideRequest.
  const geofence = await evaluateGeofence(lat, lng);
  const isOutOfFence =
    geofence.enforced && geofence.distanceMeters !== null && !geofence.inside;
  const distanceTag = isOutOfFence
    ? `${GEOFENCE_TAG} ~${geofence.distanceMeters}m / max ${geofence.config.radiusMeters}m`
    : "";

  const bypass = canBypassGeofence(caller.roles);

  const { record, usedOverrideId } = await prisma.$transaction(async (tx) => {
    await validateClockAction(tx, caller.employeeId, input.clockType, todayStart, todayEnd);

    let usedOverrideId: string | null = null;
    let extraTag = "";

    if (isOutOfFence && geofence.config.blockOutOfFence) {
      if (bypass) {
        extraTag = GEOFENCE_BYPASS_TAG;
      } else {
        const override = await findUnusedApprovedOverride(tx, caller.employeeId);
        if (!override) {
          throw new DomainError(
            "GEOFENCE_BLOCKED",
            {
              distanceMeters: geofence.distanceMeters,
              radiusMeters: geofence.config.radiusMeters,
            },
            403,
          );
        }
        usedOverrideId = override.id;
        extraTag = GEOFENCE_OVERRIDE_TAG;
      }
    }

    const finalNote = isOutOfFence
      ? annotateNote(input.note, distanceTag, extraTag)
      : input.note;

    const created = await tx.attendanceRecord.create({
      data: {
        employeeId: caller.employeeId,
        clockType: input.clockType,
        clockedAt,
        workLocation: input.workLocation,
        latitude: lat,
        longitude: lng,
        gpsAccuracyM: acc,
        deviceId: meta.deviceId,
        ipAddress: meta.ip,
        note: finalNote,
      },
    });

    if (usedOverrideId) {
      await tx.geofenceOverrideRequest.update({
        where: { id: usedOverrideId },
        data: { attendanceRecordId: created.id },
      });
    }

    return { record: created, usedOverrideId };
  }, { isolationLevel: "Serializable" });

  const auditAction = isOutOfFence
    ? usedOverrideId
      ? `attendance.clock_${input.clockType.toLowerCase()}.geofence_override`
      : `attendance.clock_${input.clockType.toLowerCase()}.out_of_geofence`
    : `attendance.clock_${input.clockType.toLowerCase()}`;

  await writeAuditLog({
    actorId: caller.userId,
    action: auditAction,
    entityType: "AttendanceRecord",
    entityId: record.id,
    after: record,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return { record, geofence } as const;
}

export type ClockResult = { record: Awaited<ReturnType<typeof prisma.attendanceRecord.create>>; geofence: GeofenceEvaluation };

export async function getMyRecords(
  employeeId: string,
  filters: AttendanceFilters,
) {
  const where = {
    employeeId,
    clockedAt: {
      gte: new Date(filters.from),
      lte: new Date(filters.to + "T23:59:59.999Z"),
    },
  };

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: { clockedAt: "desc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return { records, total, page: filters.page, perPage: filters.perPage };
}

export async function getTeamRecords(
  caller: Caller,
  date: string,
  departmentId?: string,
) {
  const dayStart = new Date(date);
  const dayEnd = new Date(date + "T23:59:59.999Z");

  // HR roles see all employees, managers see only their team
  const isHR = isSensitiveDataRole(caller.roles);

  let employeeFilter: { in: string[] } | undefined;
  if (!isHR) {
    const subordinates = await prisma.employee.findMany({
      where: { managerId: caller.employeeId },
      select: { id: true },
    });
    employeeFilter = { in: [caller.employeeId, ...subordinates.map((s) => s.id)] };
  }

  const where = {
    ...(employeeFilter && { employeeId: employeeFilter }),
    clockedAt: { gte: dayStart, lte: dayEnd },
    ...(departmentId && { employee: { departmentId } }),
  };

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          firstNameTh: true,
          lastNameTh: true,
          employeeCode: true,
        },
      },
    },
    orderBy: { clockedAt: "asc" },
  });

  return records;
}

export async function getEmployeeRecords(
  employeeId: string,
  filters: AttendanceFilters,
) {
  const exists = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });
  if (!exists) {
    throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);
  }

  return getMyRecords(employeeId, filters);
}

export async function backfillRecord(
  caller: Caller,
  recordId: string,
  input: BackfillInput,
  meta: RequestMeta,
) {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: recordId },
  });
  if (!record) {
    throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  }

  const targetDate = new Date(input.clockedAt);
  await assertCycleOpen(targetDate, caller.roles);

  const updated = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: {
      clockType: input.clockType,
      clockedAt: targetDate,
      workLocation: input.workLocation,
      isBackfilled: true,
      backfillReason: input.reason,
      backfilledBy: caller.userId,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "attendance.backfill",
    entityType: "AttendanceRecord",
    entityId: recordId,
    before: record,
    after: updated,
    reason: input.reason,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
}

export async function finalizeCycle(
  caller: Caller,
  meta: RequestMeta,
) {
  // Find the most recent open cycle and delegate to payroll-service
  const cycle = await prisma.payrollCycle.findFirst({
    where: { status: "OPEN" },
    orderBy: { cycleEnd: "desc" },
  });

  if (!cycle) {
    throw new DomainError("NO_OPEN_CYCLE", { message: "No open payroll cycle found" });
  }

  // Delegate to payroll service (single source of truth for cycle locking)
  const { lockCycle } = await import("@/lib/payroll/payroll-service");
  return lockCycle(caller, cycle.id, meta);
}
