import { prisma } from "@/lib/prisma";

interface DailyAttendance { date: string; count: number; rate: number }
interface MonthlyLeave { month: string; ANNUAL: number; SICK: number; PERSONAL: number; LWP: number }

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

export async function getAttendanceTrend(days = 30): Promise<DailyAttendance[]> {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [records, totalActive] = await Promise.all([
    prisma.attendanceRecord.groupBy({
      by: ["clockedAt"],
      where: { clockType: "IN", clockedAt: { gte: startDate } },
      _count: true,
    }),
    prisma.employee.count({
      where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
    }),
  ]);

  // Bucket by Bangkok date
  const dailyMap = new Map<string, number>();
  for (const r of records) {
    const bkkDate = new Date(new Date(r.clockedAt).getTime() + BANGKOK_OFFSET_MS)
      .toISOString().slice(0, 10);
    dailyMap.set(bkkDate, (dailyMap.get(bkkDate) ?? 0) + r._count);
  }

  // Fill missing days with 0
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

export async function getLeaveTrendByMonth(months = 6): Promise<MonthlyLeave[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const records = await prisma.leaveRequest.groupBy({
    by: ["leaveType", "startDate"],
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      startDate: { gte: startDate },
    },
    _count: true,
  });

  // Bucket by month
  const monthMap = new Map<string, MonthlyLeave>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { month: key, ANNUAL: 0, SICK: 0, PERSONAL: 0, LWP: 0 });
  }

  for (const r of records) {
    const d = new Date(r.startDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key);
    if (!entry) continue;
    const type = r.leaveType as keyof Pick<MonthlyLeave, "ANNUAL" | "SICK" | "PERSONAL" | "LWP">;
    if (type === "ANNUAL" || type === "SICK" || type === "PERSONAL") {
      entry[type] += r._count;
    } else if (r.leaveType === "LEAVE_WITHOUT_PAY") {
      entry.LWP += r._count;
    }
  }

  return Array.from(monthMap.values());
}

export interface DashboardTrends {
  attendanceTrend: DailyAttendance[];
  leaveTrend: MonthlyLeave[];
}
