import { getPrisma } from "@/lib/prisma";
import { getControlPlane } from "@/lib/db/control-plane";
import type { EmploymentStatus } from "@prisma/client";
import type { ReportFilters } from "./report-types";

export async function generateEmployeeReport(filters: ReportFilters) {
  const prisma = await getPrisma();
  const where = {
    ...(filters.departmentId && { departmentId: filters.departmentId }),
    ...(filters.status && { employmentStatus: filters.status as EmploymentStatus }),
  };

  const employees = await prisma.employee.findMany({
    where,
    include: {
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
    orderBy: { employeeCode: "asc" },
  });

  // Batch-fetch emails from CP
  const userIds = employees.map((e) => e.userId).filter((id): id is string => !!id);
  const cp = getControlPlane();
  const cpUsers = await cp.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });
  const emailById = new Map(cpUsers.map((u) => [u.id, u.email]));

  const headers = ["Code", "First Name", "Last Name", "Email", "Department", "Position", "Status", "Hire Date", "Phone"];
  const rows = employees.map((e) => [
    e.employeeCode,
    e.firstNameTh,
    e.lastNameTh,
    (e.userId ? emailById.get(e.userId) : null) ?? "-",
    e.department?.name ?? "-",
    e.position?.name ?? "-",
    e.employmentStatus,
    new Date(e.hireDate).toISOString().slice(0, 10),
    e.phone ?? "-",
  ]);

  return { headers, rows, sheetName: "Employees" };
}
