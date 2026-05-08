import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import { grantInitialLeaveQuota } from "@/lib/leave/leave-quota-grant-service";
import { createChecklistForEmployee } from "@/lib/onboarding/checklist-service";
import { hashPassword, generateInitialPassword } from "@/lib/auth/password-utils";
import { isSensitiveDataRole } from "@/lib/security/role-helpers";
import type { Caller, RequestMeta } from "@/lib/api/types";
import type { EmployeeCreateInput, EmployeeUpdateInput, EmployeeListFilters } from "./schemas";

const EMPLOYEE_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
  position: { select: { id: true, name: true } },
  manager: { select: { id: true, firstNameTh: true, lastNameTh: true, employeeCode: true } },
};

/**
 * Strip the raw Vercel Blob URL from any employee row before it leaves the
 * service. The blob is public-by-knowledge — UI must use the proxy route
 * (`/api/v1/employee/[id]/profile-picture`) which carries RBAC + audit.
 */
function shapeEmployeePublic<T extends { profilePicturePath: string | null }>(row: T, caller?: Caller) {
  const { profilePicturePath, ...rest } = row;
  const shaped = { ...rest, hasProfilePicture: profilePicturePath !== null } as T & { hasProfilePicture: boolean; baseSalary?: unknown };
  if (caller && !isSensitiveDataRole(caller.roles) && "baseSalary" in shaped) {
    delete shaped.baseSalary;
  }
  return shaped;
}

function pickSensitiveOrThrow(input: EmployeeCreateInput | EmployeeUpdateInput, caller: Caller) {
  const hasSensitive = input.baseSalary !== undefined || input.employmentType !== undefined;
  if (hasSensitive && !isSensitiveDataRole(caller.roles)) {
    throw new DomainError("INSUFFICIENT_PERMISSIONS", { fields: ["baseSalary", "employmentType"] }, 403);
  }
}

export async function createEmployee(input: EmployeeCreateInput, caller: Caller, meta: RequestMeta) {
  pickSensitiveOrThrow(input, caller);
  const hireDate = new Date(input.hireDate);
  const initialPassword = generateInitialPassword(input.employeeCode);
  const passwordHash = await hashPassword(initialPassword);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, emailVerified: new Date(), passwordHash, mustChangePassword: true },
    });

    const employee = await tx.employee.create({
      data: {
        userId: user.id, employeeCode: input.employeeCode,
        firstNameTh: input.firstNameTh, lastNameTh: input.lastNameTh,
        firstNameEn: input.firstNameEn, lastNameEn: input.lastNameEn,
        phone: input.phone, roles: input.roles, departmentId: input.departmentId,
        positionId: input.positionId, managerId: input.managerId,
        hireDate, workShift: input.workShift,
        employmentType: input.employmentType,
        baseSalary: input.baseSalary !== undefined ? new Prisma.Decimal(input.baseSalary) : null,
      },
      include: EMPLOYEE_INCLUDE,
    });

    await grantInitialLeaveQuota(employee.id, hireDate, tx);
    await createChecklistForEmployee(employee.id, undefined, tx);

    await writeAuditLog({ actorId: caller.userId, action: "employee.create", entityType: "Employee", entityId: employee.id, after: employee, ipAddress: meta.ip, userAgent: meta.userAgent }, tx);

    return employee;
  });

  return { ...shapeEmployeePublic(result, caller), initialPassword };
}

export async function updateEmployee(employeeId: string, input: EmployeeUpdateInput, caller: Caller, meta: RequestMeta) {
  pickSensitiveOrThrow(input, caller);
  const existing = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!existing) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);

  const { baseSalary, ...rest } = input;
  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...rest,
      ...(baseSalary !== undefined ? { baseSalary: new Prisma.Decimal(baseSalary) } : {}),
    },
    include: EMPLOYEE_INCLUDE,
  });

  await writeAuditLog({ actorId: caller.userId, action: "employee.update", entityType: "Employee", entityId: employeeId, before: existing, after: updated, ipAddress: meta.ip, userAgent: meta.userAgent });

  return shapeEmployeePublic(updated, caller);
}

export async function getEmployeeById(employeeId: string, caller?: Caller) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { ...EMPLOYEE_INCLUDE, user: { select: { email: true } } },
  });
  if (!employee) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);
  return shapeEmployeePublic(employee, caller);
}

export async function listEmployees(filters: EmployeeListFilters, caller?: Caller) {
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

  return { items: items.map((e) => shapeEmployeePublic(e, caller)), total, page: filters.page, perPage: filters.perPage };
}
