import { getPrisma } from "@/lib/prisma";
import type { LeaveStatus } from "@prisma/client";
import type { ReportFilters } from "./report-types";

export async function generateOTReport(filters: ReportFilters) {
  const prisma = await getPrisma();
  const where = {
    date: {
      gte: new Date(filters.dateFrom),
      lte: new Date(filters.dateTo),
    },
    ...(filters.status && { status: filters.status as LeaveStatus }),
    ...(filters.departmentId && { employee: { departmentId: filters.departmentId } }),
  };

  const records = await prisma.overtimeRequest.findMany({
    where,
    include: {
      employee: {
        select: { employeeCode: true, firstNameTh: true, lastNameTh: true, department: { select: { name: true } } },
      },
    },
    orderBy: [{ date: "asc" }],
  });

  const headers = ["Employee Code", "Name", "Department", "Date", "OT Type", "Hours", "Rate", "Status"];
  const rows = records.map((r) => [
    r.employee.employeeCode,
    `${r.employee.firstNameTh} ${r.employee.lastNameTh}`,
    r.employee.department?.name ?? "-",
    new Date(r.date).toISOString().slice(0, 10),
    r.overtimeType,
    String(r.hoursApproved ?? 0),
    `${r.rateMultiplier}x`,
    r.status,
  ]);

  return { headers, rows, sheetName: "Overtime" };
}
