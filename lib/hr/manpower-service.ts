import { prisma } from "@/lib/prisma";
import type { LeaveType } from "@prisma/client";

export type ManpowerStatus = "WORKING" | "ON_LEAVE" | "OFF";

export interface ManpowerEmployee {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  nicknameTh: string | null;
  departmentName: string | null;
  status: ManpowerStatus;
  leaveType: LeaveType | null;
  lastClockInAt: string | null;
}

const ACTIVE_STATUSES = ["ACTIVE", "PROBATION"] as const;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Returns Bangkok-timezone day boundaries for a given YYYY-MM-DD date string.
 */
function bangkokDayRange(dateStr: string) {
  const dayStart = new Date(dateStr + "T00:00:00.000Z");
  dayStart.setTime(dayStart.getTime() - BANGKOK_OFFSET_MS);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const dateOnly = new Date(dateStr + "T00:00:00.000Z");
  return { dayStart, dayEnd, dateOnly };
}

export function todayBangkokDateString(): string {
  return new Date(Date.now() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Returns per-employee status (working / on leave / off) for a given date.
 * `dateStr` must be YYYY-MM-DD; defaults to today (Bangkok time).
 */
export async function getManpower(dateStr: string = todayBangkokDateString()): Promise<ManpowerEmployee[]> {
  const { dayStart, dayEnd, dateOnly } = bangkokDayRange(dateStr);

  const [employees, todaysClocks, todaysLeaves] = await Promise.all([
    prisma.employee.findMany({
      where: { employmentStatus: { in: [...ACTIVE_STATUSES] } },
      select: {
        id: true,
        employeeCode: true,
        firstNameTh: true,
        lastNameTh: true,
        nicknameTh: true,
        department: { select: { name: true } },
      },
      orderBy: { employeeCode: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { clockedAt: { gte: dayStart, lte: dayEnd } },
      select: { employeeId: true, clockType: true, clockedAt: true },
      orderBy: { clockedAt: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: dateOnly },
        endDate: { gte: dateOnly },
      },
      select: { employeeId: true, leaveType: true },
    }),
  ]);

  const leaveByEmployee = new Map<string, LeaveType>();
  for (const l of todaysLeaves) leaveByEmployee.set(l.employeeId, l.leaveType);

  const lastClockByEmployee = new Map<string, { type: "IN" | "OUT"; at: Date }>();
  for (const c of todaysClocks) {
    lastClockByEmployee.set(c.employeeId, { type: c.clockType, at: c.clockedAt });
  }

  return employees.map((e) => {
    const leaveType = leaveByEmployee.get(e.id) ?? null;
    const lastClock = lastClockByEmployee.get(e.id);
    const isWorking = !leaveType && lastClock?.type === "IN";

    const status: ManpowerStatus = leaveType
      ? "ON_LEAVE"
      : isWorking
        ? "WORKING"
        : "OFF";

    return {
      id: e.id,
      employeeCode: e.employeeCode,
      firstNameTh: e.firstNameTh,
      lastNameTh: e.lastNameTh,
      nicknameTh: e.nicknameTh,
      departmentName: e.department?.name ?? null,
      status,
      leaveType,
      lastClockInAt: isWorking && lastClock ? lastClock.at.toISOString() : null,
    };
  });
}
