// ════════════════════════════════════════════════════════════════
// Leave Report Service — HR leave summary reports
// ════════════════════════════════════════════════════════════════

import { getPrisma } from "@/lib/prisma";

interface ReportFilters {
  year: number;
  leaveType?: string;
  departmentId?: string;
}

export async function generateReport(filters: ReportFilters) {
  const prisma = await getPrisma();
  const where = {
    startDate: {
      gte: new Date(`${filters.year}-01-01`),
      lte: new Date(`${filters.year}-12-31`),
    },
    status: { in: ["APPROVED" as const, "PENDING" as const] },
    ...(filters.leaveType && { leaveType: filters.leaveType as never }),
    ...(filters.departmentId && {
      employee: { departmentId: filters.departmentId },
    }),
  };

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          firstNameTh: true,
          lastNameTh: true,
          employeeCode: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: [{ employee: { employeeCode: "asc" } }, { startDate: "asc" }],
  });

  // Group by employee
  const byEmployee = new Map<
    string,
    { employee: (typeof requests)[0]["employee"]; totalDays: number; count: number }
  >();

  for (const req of requests) {
    const existing = byEmployee.get(req.employeeId);
    const days = req.daysRequested.toNumber();
    if (existing) {
      existing.totalDays += days;
      existing.count += 1;
    } else {
      byEmployee.set(req.employeeId, {
        employee: req.employee,
        totalDays: days,
        count: 1,
      });
    }
  }

  return {
    year: filters.year,
    totalRequests: requests.length,
    summary: Array.from(byEmployee.values()),
  };
}
