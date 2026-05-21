import type { PrismaClient } from "@prisma/client";

export async function getDashboardData(prisma: PrismaClient) {
  const today = new Date();
  // Set today start/end in Bangkok time (UTC+7)
  const bangkokOffset = 7 * 60 * 60 * 1000;
  const bangkokNow = new Date(today.getTime() + bangkokOffset);
  const todayStr = bangkokNow.toISOString().slice(0, 10);
  const todayStart = new Date(todayStr + "T00:00:00.000Z");
  todayStart.setTime(todayStart.getTime() - bangkokOffset);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  const [headcount, pendingLeaves, todayAttendance, leavesByMonth] =
    await Promise.all([
      // Headcount by status
      prisma.employee.groupBy({
        by: ["employmentStatus"],
        _count: true,
      }),
      // Pending leave requests
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      // Today's clock-ins
      prisma.attendanceRecord.count({
        where: {
          clockType: "IN",
          clockedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      // Leave requests by type (last 6 months)
      prisma.leaveRequest.groupBy({
        by: ["leaveType"],
        where: {
          status: { in: ["APPROVED", "PENDING"] },
          startDate: {
            gte: new Date(today.getFullYear(), today.getMonth() - 5, 1),
          },
        },
        _count: true,
      }),
    ]);

  const totalActive = headcount
    .filter((h) =>
      ["ACTIVE", "PROBATION"].includes(h.employmentStatus),
    )
    .reduce((sum, h) => sum + h._count, 0);

  return {
    headcount: headcount.map((h) => ({
      status: h.employmentStatus,
      count: h._count,
    })),
    totalActive,
    pendingLeaves,
    todayAttendance,
    leavesByType: leavesByMonth.map((l) => ({
      type: l.leaveType,
      count: l._count,
    })),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
