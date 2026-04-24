// ════════════════════════════════════════════════════════════════
// Overtime Service — submit weekday & holiday OT, list my requests
// ════════════════════════════════════════════════════════════════

import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { assertCycleOpen } from "@/lib/api/cycle-guard";
import { calculateWeekdayOT, calculateHolidayOT, getOTRate, isHolidayOrWeekend, WORK_END_HOUR } from "./ot-calculation";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { OTSubmitWeekdayInput, OTSubmitHolidayInput, OTFilters } from "./schemas";

const OT_TOO_SHORT = "OT_TOO_SHORT";

export async function submitWeekdayOT(
  caller: Caller,
  input: OTSubmitWeekdayInput,
  meta: RequestMeta,
) {
  const date = new Date(input.date);

  await assertCycleOpen(date, caller.roles);

  // Validate this is actually a weekday
  if (await isHolidayOrWeekend(date)) {
    throw new DomainError("INVALID_OT_TYPE", { message: "Cannot submit weekday OT on a weekend or holiday. Use holiday OT instead." });
  }

  // Find today's clock-out
  const clockOut = await prisma.attendanceRecord.findFirst({
    where: { employeeId: caller.employeeId, date, clockType: "OUT" },
  });
  if (!clockOut) {
    throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {
      message: "No clock-out record found for this date",
    });
  }

  const hours = calculateWeekdayOT(clockOut.clockedAt);
  if (!hours) {
    throw new DomainError(OT_TOO_SHORT, {
      message: "OT must be at least 30 minutes",
    });
  }

  const employee = await prisma.employee.findUnique({
    where: { id: caller.employeeId },
    select: { managerId: true },
  });

  // actualStart = 18:00 UTC of that day
  const actualStart = new Date(date);
  actualStart.setUTCHours(WORK_END_HOUR, 0, 0, 0);

  const request = await prisma.overtimeRequest.create({
    data: {
      employeeId: caller.employeeId,
      date,
      overtimeType: "WEEKDAY",
      rateMultiplier: getOTRate("WEEKDAY"),
      hoursApproved: hours,
      actualStart,
      actualEnd: clockOut.clockedAt,
      reason: input.reason,
      status: "PENDING",
      approverId: employee?.managerId,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "overtime.submit",
    entityType: "OvertimeRequest",
    entityId: request.id,
    after: request,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return request;
}

export async function submitHolidayOT(
  caller: Caller,
  input: OTSubmitHolidayInput,
  meta: RequestMeta,
) {
  const date = new Date(input.date);
  const assignedStart = new Date(input.assignedStart);
  const assignedEnd = new Date(input.assignedEnd);

  await assertCycleOpen(date, caller.roles);

  // Validate this is actually a holiday/weekend
  if (!(await isHolidayOrWeekend(date))) {
    throw new DomainError("INVALID_OT_TYPE", { message: "Cannot submit holiday OT on a regular weekday. Use weekday OT instead." });
  }

  // Find actual attendance IN/OUT for that date
  const [clockIn, clockOut] = await Promise.all([
    prisma.attendanceRecord.findFirst({
      where: { employeeId: caller.employeeId, date, clockType: "IN" },
    }),
    prisma.attendanceRecord.findFirst({
      where: { employeeId: caller.employeeId, date, clockType: "OUT" },
    }),
  ]);

  if (!clockIn || !clockOut) {
    throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {
      message: "Missing attendance records (IN/OUT) for this date",
    });
  }

  const hours = calculateHolidayOT(
    assignedStart,
    assignedEnd,
    clockIn.clockedAt,
    clockOut.clockedAt,
  );
  if (!hours) {
    throw new DomainError(OT_TOO_SHORT, {
      message: "OT must be at least 30 minutes",
    });
  }

  const employee = await prisma.employee.findUnique({
    where: { id: caller.employeeId },
    select: { managerId: true },
  });

  // Holiday and weekend both use 3.0 rate
  const rateMultiplier = getOTRate("HOLIDAY");

  const request = await prisma.overtimeRequest.create({
    data: {
      employeeId: caller.employeeId,
      date,
      overtimeType: "HOLIDAY",
      assignedStart,
      assignedEnd,
      actualStart: clockIn.clockedAt,
      actualEnd: clockOut.clockedAt,
      hoursApproved: hours,
      rateMultiplier,
      reason: input.reason,
      status: "PENDING",
      approverId: employee?.managerId,
    },
  });

  await writeAuditLog({
    actorId: caller.userId,
    action: "overtime.submit",
    entityType: "OvertimeRequest",
    entityId: request.id,
    after: request,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return request;
}

export async function getMyOTRequests(employeeId: string, filters: OTFilters) {
  const where = {
    employeeId,
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.overtimeRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    prisma.overtimeRequest.count({ where }),
  ]);

  return { items, total, page: filters.page, perPage: filters.perPage };
}
