import { prisma } from "@/lib/prisma";
import { getBangkokDayBounds } from "@/lib/attendance/clock-validation";

const DAY_MS = 24 * 60 * 60 * 1000;

interface KPIDelta {
  value: number;
  delta: number | null;
}

export interface DashboardSummary {
  totalEmployees: KPIDelta;
  newHires: KPIDelta;
  pendingApprovals: KPIDelta;
  todayAttendance: KPIDelta;
  payrollStatus: { status: "OPEN" | "LOCKED" | "EXPORTED" | "NONE"; cycleLabel: string | null };
  avgHoursToday: { value: number };
}

export async function getDashboardSummary(now: Date = new Date()): Promise<DashboardSummary> {
  const { todayStart, todayEnd } = getBangkokDayBounds(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS);

  const ACTIVE: { in: Array<"ACTIVE" | "PROBATION"> } = { in: ["ACTIVE", "PROBATION"] };

  const [
    activeCount,
    activeCountThirtyAgo,
    newHiresNow,
    newHiresPrev,
    pendingLeave,
    pendingOT,
    pendingTA,
    todayRecords,
    yesterdayDistinctIns,
    activeCycle,
  ] = await Promise.all([
    prisma.employee.count({ where: { employmentStatus: ACTIVE } }),
    prisma.employee.count({
      where: { employmentStatus: ACTIVE, hireDate: { lt: thirtyDaysAgo } },
    }),
    prisma.employee.count({
      where: { employmentStatus: ACTIVE, hireDate: { gte: thirtyDaysAgo } },
    }),
    prisma.employee.count({
      where: { employmentStatus: ACTIVE, hireDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.overtimeRequest.count({ where: { status: "PENDING" } }),
    prisma.timeAdjustmentRequest.count({ where: { status: "PENDING" } }),
    prisma.attendanceRecord.findMany({
      where: { clockedAt: { gte: todayStart, lte: todayEnd } },
      select: { employeeId: true, clockType: true, clockedAt: true },
      orderBy: { clockedAt: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        clockType: "IN",
        clockedAt: {
          gte: new Date(todayStart.getTime() - DAY_MS),
          lte: new Date(todayEnd.getTime() - DAY_MS),
        },
      },
      select: { employeeId: true },
      distinct: ["employeeId"],
    }),
    prisma.payrollCycle.findFirst({
      where: { status: { in: ["OPEN", "LOCKED"] } },
      orderBy: { cycleStart: "desc" },
      select: { status: true, cycleStart: true, cycleEnd: true },
    }),
  ]);

  const firstIn = new Map<string, Date>();
  const lastOut = new Map<string, Date>();
  for (const r of todayRecords) {
    if (r.clockType === "IN" && !firstIn.has(r.employeeId)) firstIn.set(r.employeeId, r.clockedAt);
    if (r.clockType === "OUT") lastOut.set(r.employeeId, r.clockedAt);
  }
  const todayPresent = firstIn.size;
  const yesterdayPresent = yesterdayDistinctIns.length;
  const completed = [...firstIn.entries()]
    .map(([id, inAt]) => {
      const outAt = lastOut.get(id);
      return outAt && outAt > inAt ? (outAt.getTime() - inAt.getTime()) / 3_600_000 : null;
    })
    .filter((h): h is number => h !== null);
  const avgHours = completed.length
    ? Math.round((completed.reduce((a, b) => a + b, 0) / completed.length) * 10) / 10
    : 0;

  const totalApprovals = pendingLeave + pendingOT + pendingTA;

  let cycleLabel: string | null = null;
  if (activeCycle) {
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    cycleLabel = `${fmt(activeCycle.cycleStart)} – ${fmt(activeCycle.cycleEnd)}`;
  }

  return {
    totalEmployees: {
      value: activeCount,
      delta: activeCount - activeCountThirtyAgo,
    },
    newHires: {
      value: newHiresNow,
      delta: newHiresNow - newHiresPrev,
    },
    pendingApprovals: { value: totalApprovals, delta: null },
    todayAttendance: {
      value: todayPresent,
      delta: todayPresent - yesterdayPresent,
    },
    payrollStatus: {
      status: activeCycle?.status ?? "NONE",
      cycleLabel,
    },
    avgHoursToday: { value: avgHours },
  };
}
