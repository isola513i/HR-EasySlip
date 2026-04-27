import { prisma } from "@/lib/prisma";
import type { EmploymentStatus } from "@prisma/client";
import type { ReportFilters } from "./report-types";

export async function generateEmployeeReport(filters: ReportFilters) {
  const where = {
    ...(filters.departmentId && { departmentId: filters.departmentId }),
    ...(filters.status && { employmentStatus: filters.status as EmploymentStatus }),
  };

  const employees = await prisma.employee.findMany({
    where,
    include: {
      user: { select: { email: true } },
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
    orderBy: { employeeCode: "asc" },
  });

  const headers = ["Code", "First Name", "Last Name", "Email", "Department", "Position", "Status", "Hire Date", "Phone"];
  const rows = employees.map((e) => [
    e.employeeCode,
    e.firstNameTh,
    e.lastNameTh,
    e.user?.email ?? "-",
    e.department?.name ?? "-",
    e.position?.name ?? "-",
    e.employmentStatus,
    new Date(e.hireDate).toISOString().slice(0, 10),
    e.phone ?? "-",
  ]);

  return { headers, rows, sheetName: "Employees" };
}
