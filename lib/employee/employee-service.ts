import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { grantInitialLeaveQuota } from "@/lib/leave/leave-quota-grant-service";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { EmployeeCreateInput, EmployeeUpdateInput, EmployeeListFilters } from "./schemas";

const EMPLOYEE_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
  position: { select: { id: true, name: true } },
  manager: { select: { id: true, firstNameTh: true, lastNameTh: true, employeeCode: true } },
};

export async function createEmployee(input: EmployeeCreateInput, caller: Caller, meta: RequestMeta) {
  const hireDate = new Date(input.hireDate);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, emailVerified: new Date() },
    });

    const employee = await tx.employee.create({
      data: {
        userId: user.id, employeeCode: input.employeeCode,
        firstNameTh: input.firstNameTh, lastNameTh: input.lastNameTh,
        firstNameEn: input.firstNameEn, lastNameEn: input.lastNameEn,
        phone: input.phone, roles: input.roles, departmentId: input.departmentId,
        positionId: input.positionId, managerId: input.managerId,
        hireDate, workShift: input.workShift,
      },
      include: EMPLOYEE_INCLUDE,
    });

    await grantInitialLeaveQuota(employee.id, hireDate, tx);

    await writeAuditLog({ actorId: caller.userId, action: "employee.create", entityType: "Employee", entityId: employee.id, after: employee, ipAddress: meta.ip, userAgent: meta.userAgent }, tx);

    return employee;
  });
}

export async function updateEmployee(employeeId: string, input: EmployeeUpdateInput, caller: Caller, meta: RequestMeta) {
  const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!existing) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { ...input },
    include: EMPLOYEE_INCLUDE,
  });

  await writeAuditLog({ actorId: caller.userId, action: "employee.update", entityType: "Employee", entityId: employeeId, before: existing, after: updated, ipAddress: meta.ip, userAgent: meta.userAgent });

  return updated;
}

export async function getEmployeeById(employeeId: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { ...EMPLOYEE_INCLUDE, user: { select: { email: true } } },
  });
  if (!employee) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);
  return employee;
}

export async function listEmployees(filters: EmployeeListFilters) {
  const where = {
    ...(filters.status && { employmentStatus: filters.status }),
    ...(filters.departmentId && { departmentId: filters.departmentId }),
    ...(filters.search && {
      OR: [
        { employeeCode: { contains: filters.search, mode: "insensitive" as const } },
        { firstNameTh: { contains: filters.search, mode: "insensitive" as const } },
        { lastNameTh: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where, include: { ...EMPLOYEE_INCLUDE, user: { select: { email: true } } },
      orderBy: { employeeCode: "asc" },
      skip: (filters.page - 1) * filters.perPage, take: filters.perPage,
    }),
    prisma.employee.count({ where }),
  ]);

  return { items, total, page: filters.page, perPage: filters.perPage };
}
