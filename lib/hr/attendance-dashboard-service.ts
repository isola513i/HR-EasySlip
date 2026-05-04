import { prisma } from "@/lib/prisma";
import { getBangkokDayBounds } from "@/lib/attendance/clock-validation";
import {
  WEEKDAY_KEYS,
  type AttendanceStatus,
  type WeekdayKey,
} from "@/lib/attendance/constants";
import { loadAttendancePolicy, type AttendancePolicy } from "@/lib/attendance/policy";

/** Pure status classifier — exported for unit testing. */
export function computeStatus(args: {
  firstClockInAt: Date | null;
  isOnLeave: boolean;
  isHoliday: boolean;
  lateAfter: { h: number; m: number };
}): AttendanceStatus {
  if (args.isHoliday) return "HOLIDAY";
  if (args.isOnLeave) return "ON_LEAVE";
  if (!args.firstClockInAt) return "ABSENT";

  const bangkokMs = args.firstClockInAt.getTime() + 7 * 60 * 60 * 1000;
  const t = new Date(bangkokMs);
  const h = t.getUTCHours();
  const m = t.getUTCMinutes();
  const isLate =
    h > args.lateAfter.h || (h === args.lateAfter.h && m > args.lateAfter.m);
  return isLate ? "LATE" : "ON_TIME";
}

interface ActiveEmployee {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  departmentId: string | null;
  departmentName: string | null;
}

async function listActiveEmployees(): Promise<ActiveEmployee[]> {
  const rows = await prisma.employee.findMany({
    where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, isAnonymized: false },
    select: {
      id: true,
      employeeCode: true,
      firstNameTh: true,
      lastNameTh: true,
      departmentId: true,
      department: { select: { name: true } },
    },
    orderBy: { employeeCode: "asc" },
  });
  return rows.map((e) => ({
    id: e.id,
    employeeCode: e.employeeCode,
    firstNameTh: e.firstNameTh,
    lastNameTh: e.lastNameTh,
    departmentId: e.departmentId,
    departmentName: e.department?.name ?? null,
  }));
}

async function getDayContext(date: Date) {
  const { todayStart, todayEnd } = getBangkokDayBounds(date);

  const [records, leaves, holiday] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { clockedAt: { gte: todayStart, lte: todayEnd } },
      select: { employeeId: true, clockType: true, clockedAt: true },
      orderBy: { clockedAt: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart },
      },
      select: { employeeId: true },
    }),
    prisma.publicHoliday.findFirst({
      where: { date: { gte: todayStart, lte: todayEnd } },
      select: { id: true },
    }),
  ]);

  const firstIn = new Map<string, Date>();
  const lastOut = new Map<string, Date>();
  for (const r of records) {
    if (r.clockType === "IN" && !firstIn.has(r.employeeId)) {
      firstIn.set(r.employeeId, r.clockedAt);
    }
    if (r.clockType === "OUT") lastOut.set(r.employeeId, r.clockedAt);
  }
  const onLeave = new Set(leaves.map((l) => l.employeeId));
  return { firstIn, lastOut, onLeave, isHoliday: !!holiday };
}

export async function getAttendanceSummary(date: Date) {
  const [employees, ctx, policy] = await Promise.all([
    listActiveEmployees(),
    getDayContext(date),
    loadAttendancePolicy(),
  ]);

  let presentToday = 0;
  let lateArrivals = 0;
  let absent = 0;
  const durations: number[] = [];

  for (const e of employees) {
    const inAt = ctx.firstIn.get(e.id) ?? null;
    const status = computeStatus({
      firstClockInAt: inAt,
      isOnLeave: ctx.onLeave.has(e.id),
      isHoliday: ctx.isHoliday,
      lateAfter: policy.lateAfter,
    });
    if (status === "ON_TIME" || status === "LATE") presentToday++;
    if (status === "LATE") lateArrivals++;
    if (status === "ABSENT") absent++;

    const outAt = ctx.lastOut.get(e.id);
    if (inAt && outAt && outAt > inAt) {
      durations.push((outAt.getTime() - inAt.getTime()) / 3_600_000);
    }
  }

  const avgHours = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  return {
    presentToday,
    lateArrivals,
    absent,
    avgHours: Math.round(avgHours * 10) / 10,
  };
}

export async function getWeeklyAttendance(weekStart: Date) {
  const [employees, policy] = await Promise.all([
    listActiveEmployees(),
    loadAttendancePolicy(),
  ]);

  const days = await Promise.all(
    WEEKDAY_KEYS.map(async (key, idx) => {
      const day = new Date(weekStart);
      day.setUTCDate(day.getUTCDate() + idx);
      const ctx = await getDayContext(day);
      let present = 0;
      let late = 0;
      let absent = 0;
      for (const e of employees) {
        const status = computeStatus({
          firstClockInAt: ctx.firstIn.get(e.id) ?? null,
          isOnLeave: ctx.onLeave.has(e.id),
          isHoliday: ctx.isHoliday,
          lateAfter: policy.lateAfter,
        });
        if (status === "ON_TIME") present++;
        else if (status === "LATE") late++;
        else if (status === "ABSENT") absent++;
      }
      return { day: key as WeekdayKey, present, late, absent };
    }),
  );

  return days;
}

export async function getTodayAttendance(date: Date) {
  const [employees, ctx, policy] = await Promise.all([
    listActiveEmployees(),
    getDayContext(date),
    loadAttendancePolicy(),
  ]);

  return employees.map((e) => {
    const inAt = ctx.firstIn.get(e.id) ?? null;
    const outAt = ctx.lastOut.get(e.id) ?? null;
    const status = computeStatus({
      firstClockInAt: inAt,
      isOnLeave: ctx.onLeave.has(e.id),
      isHoliday: ctx.isHoliday,
      lateAfter: policy.lateAfter,
    });
    const workingMinutes = inAt && outAt && outAt > inAt
      ? Math.round((outAt.getTime() - inAt.getTime()) / 60_000)
      : null;

    return {
      employeeId: e.id,
      employeeCode: e.employeeCode,
      firstNameTh: e.firstNameTh,
      lastNameTh: e.lastNameTh,
      departmentId: e.departmentId,
      departmentName: e.departmentName,
      checkIn: inAt?.toISOString() ?? null,
      checkOut: outAt?.toISOString() ?? null,
      workingMinutes,
      status,
    };
  });
}
