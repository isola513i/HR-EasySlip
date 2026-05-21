import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getControlPlane } from "@/lib/db/control-plane";
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

  // Create CP user before the tenant transaction (cross-silo, can't be part of Prisma tx)
  const cp = getControlPlane();
  const cpUser = await cp.user.upsert({
    where: { email: input.email },
    create: { email: input.email, emailVerified: new Date(), passwordHash, mustChangePassword: true },
    update: {},
    select: { id: true },
  });

  const prisma = await getPrisma();
  const result = await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        userId: cpUser.id, employeeCode: input.employeeCode,
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

    if (input.baseSalary !== undefined) {
      await tx.salaryAdjustment.create({
        data: {
          employeeId: employee.id,
          effectiveDate: hireDate,
          adjustmentType: "INITIAL",
          salaryBefore: null,
          salaryAfter: new Prisma.Decimal(input.baseSalary),
          ratePct: null,
          note: null,
          actorId: caller.userId,
        },
      });
    }

    await grantInitialLeaveQuota(employee.id, hireDate, tx);
    await createChecklistForEmployee(employee.id, undefined, tx);

    await writeAuditLog({ actorId: caller.userId, action: "employee.create", entityType: "Employee", entityId: employee.id, after: employee, ipAddress: meta.ip, userAgent: meta.userAgent }, tx);

    return employee;
  });

  return { ...shapeEmployeePublic(result, caller), initialPassword };
}

export async function updateEmployee(employeeId: string, input: EmployeeUpdateInput, caller: Caller, meta: RequestMeta) {
  pickSensitiveOrThrow(input, caller);
  const { baseSalary, salaryAdjustmentType, salaryAdjustmentNote, ...rest } = input;
  const prisma = await getPrisma();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.employee.findUnique({ where: { id: employeeId } });
    if (!existing) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);

    const updated = await tx.employee.update({
      where: { id: employeeId },
      data: {
        ...rest,
        ...(baseSalary !== undefined ? { baseSalary: new Prisma.Decimal(baseSalary) } : {}),
      },
      include: EMPLOYEE_INCLUDE,
    });

    if (baseSalary !== undefined) {
      const before = existing.baseSalary ?? null;
      const after = new Prisma.Decimal(baseSalary);
      const changed = !before || !before.equals(after);
      if (changed) {
        const ratePct = before && !before.isZero()
          ? after.minus(before).div(before).mul(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
          : null;
        await tx.salaryAdjustment.create({
          data: {
            employeeId,
            effectiveDate: new Date(),
            adjustmentType: salaryAdjustmentType ?? (before ? "CORRECTION" : "INITIAL"),
            salaryBefore: before,
            salaryAfter: after,
            ratePct,
            note: salaryAdjustmentNote ?? null,
            actorId: caller.userId,
          },
        });
      }
    }

    await writeAuditLog({ actorId: caller.userId, action: "employee.update", entityType: "Employee", entityId: employeeId, before: existing, after: updated, ipAddress: meta.ip, userAgent: meta.userAgent }, tx);

    return shapeEmployeePublic(updated, caller);
  });
}

export async function getEmployeeById(employeeId: string, caller?: Caller) {
  const prisma = await getPrisma();
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { ...EMPLOYEE_INCLUDE, user: { select: { email: true } } },
  });
  if (!employee) throw new DomainError(ErrorCodes.EMPLOYEE_NOT_FOUND, {}, 404);
  return shapeEmployeePublic(employee, caller);
}

/**
 * Count active/probation employees that are missing baseSalary. Used by
 * the directory banner + cycle-lock confirmation to warn HR that OT
 * calculation will yield zero for those rows.
 */
export async function countEmployeesMissingBaseSalary(): Promise<number> {
  const prisma = await getPrisma();
  return prisma.employee.count({
    where: {
      employmentStatus: { in: ["ACTIVE", "PROBATION"] },
      baseSalary: null,
    },
  });
}

export async function listEmployees(filters: EmployeeListFilters, caller?: Caller) {
  const prisma = await getPrisma();
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
