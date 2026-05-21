import { getPrisma } from "@/lib/prisma";
import type { ReportFilters } from "./report-types";

export async function generateAttendanceReport(filters: ReportFilters) {
  const prisma = await getPrisma();
  const where = {
    clockedAt: {
      gte: new Date(filters.dateFrom),
      lte: new Date(filters.dateTo + "T23:59:59.999Z"),
    },
    ...(filters.departmentId && { employee: { departmentId: filters.departmentId } }),
  };

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: {
        select: { employeeCode: true, firstNameTh: true, lastNameTh: true, department: { select: { name: true } } },
      },
    },
    orderBy: [{ employeeId: "asc" }, { clockedAt: "asc" }],
  });

  const headers = ["Employee Code", "Name", "Department", "Date", "Clock Type", "Time", "Location"];
  const rows = records.map((r) => [
    r.employee.employeeCode,
    `${r.employee.firstNameTh} ${r.employee.lastNameTh}`,
    r.employee.department?.name ?? "-",
    new Date(r.clockedAt).toISOString().slice(0, 10),
    r.clockType,
    new Date(r.clockedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    r.workLocation,
  ]);

  return { headers, rows, sheetName: "Attendance" };
}
