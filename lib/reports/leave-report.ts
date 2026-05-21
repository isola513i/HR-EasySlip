import { getPrisma } from "@/lib/prisma";
import type { LeaveStatus } from "@prisma/client";
import type { ReportFilters } from "./report-types";

export async function generateLeaveReport(filters: ReportFilters) {
  const prisma = await getPrisma();
  const where = {
    startDate: { gte: new Date(filters.dateFrom) },
    endDate: { lte: new Date(filters.dateTo) },
    ...(filters.status && { status: filters.status as LeaveStatus }),
    ...(filters.departmentId && { employee: { departmentId: filters.departmentId } }),
  };

  const records = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: { employeeCode: true, firstNameTh: true, lastNameTh: true, department: { select: { name: true } } },
      },
    },
    orderBy: [{ startDate: "asc" }],
  });

  const headers = ["Employee Code", "Name", "Department", "Leave Type", "Start", "End", "Days", "Status"];
  const rows = records.map((r) => [
    r.employee.employeeCode,
    `${r.employee.firstNameTh} ${r.employee.lastNameTh}`,
    r.employee.department?.name ?? "-",
    r.leaveType,
    new Date(r.startDate).toISOString().slice(0, 10),
    new Date(r.endDate).toISOString().slice(0, 10),
    String(r.daysRequested),
    r.status,
  ]);

  return { headers, rows, sheetName: "Leave" };
}
