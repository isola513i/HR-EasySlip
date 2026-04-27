import { prisma } from "@/lib/prisma";

interface DailyAttendance { date: string; count: number; rate: number }
interface MonthlyLeave { month: string; ANNUAL: number; SICK: number; PERSONAL: number; LWP: number }

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

function toBkkDateStr(d: Date): string {
  return new Date(d.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

export async function getAttendanceTrend(days = 30): Promise<DailyAttendance[]> {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [records, totalActive] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { clockType: "IN", clockedAt: { gte: startDate } },
      select: { clockedAt: true },
    }),
    prisma.employee.count({
      where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
    }),
  ]);

  const dailyMap = new Map<string, number>();
  for (const r of records) {
    const dateStr = toBkkDateStr(r.clockedAt);
    dailyMap.set(dateStr, (dailyMap.get(dateStr) ?? 0) + 1);
  }

  const result: DailyAttendance[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000 + BANGKOK_OFFSET_MS);
    const dateStr = d.toISOString().slice(0, 10);
    const count = dailyMap.get(dateStr) ?? 0;
    result.push({
      date: dateStr,
      count,
      rate: totalActive > 0 ? Math.round((count / totalActive) * 100) : 0,
    });
  }

  return result;
}

const TRACKED_LEAVE_TYPES = new Set(["ANNUAL", "SICK", "PERSONAL", "LEAVE_WITHOUT_PAY"]);

export async function getLeaveTrendByMonth(months = 6): Promise<MonthlyLeave[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const records = await prisma.leaveRequest.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      startDate: { gte: startDate },
    },
    select: { leaveType: true, startDate: true },
  });

  const monthMap = new Map<string, MonthlyLeave>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { month: key, ANNUAL: 0, SICK: 0, PERSONAL: 0, LWP: 0 });
  }

  for (const r of records) {
    if (!TRACKED_LEAVE_TYPES.has(r.leaveType)) continue;
    const d = new Date(r.startDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key);
    if (!entry) continue;
    if (r.leaveType === "ANNUAL") entry.ANNUAL++;
    else if (r.leaveType === "SICK") entry.SICK++;
    else if (r.leaveType === "PERSONAL") entry.PERSONAL++;
    else if (r.leaveType === "LEAVE_WITHOUT_PAY") entry.LWP++;
  }

  return Array.from(monthMap.values());
}

export interface DashboardTrends {
  attendanceTrend: DailyAttendance[];
  leaveTrend: MonthlyLeave[];
}
