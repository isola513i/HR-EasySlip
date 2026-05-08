import Papa from "papaparse";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { hashPassword, generateInitialPassword } from "@/lib/auth/password-utils";
import { grantInitialLeaveQuota } from "@/lib/leave/leave-quota-grant-service";
import { createChecklistForEmployee } from "@/lib/onboarding/checklist-service";
import { isSensitiveDataRole } from "@/lib/security/role-helpers";
import { DomainError } from "@/lib/api/errors";
import { EmployeeCreateSchema } from "./schemas";
import type { Caller, RequestMeta } from "@/lib/api/types";

interface ImportRow {
  rowIndex: number;
  employeeCode: string;
  email: string;
  firstNameTh: string;
  lastNameTh: string;
  hireDate: string;
  firstNameEn?: string;
  lastNameEn?: string;
  phone?: string;
  workShift?: string;
  departmentCode?: string;
  positionTitle?: string;
  managerEmployeeCode?: string;
  employmentType?: "MONTHLY" | "DAILY" | "INTERN";
  baseSalary?: number;
}

interface BulkImportResult {
  created: { rowIndex: number; employeeCode: string; initialPassword: string }[];
  errors: { rowIndex: number; field?: string; message: string }[];
  totalRows: number;
}

interface LookupMaps {
  deptByCode: Map<string, string>;
  positionByName: Map<string, string>;
  employeeByCode: Map<string, string>;
}

async function buildLookupMaps(rows: ImportRow[]): Promise<LookupMaps> {
  const deptCodes = new Set(rows.map((r) => r.departmentCode).filter((v): v is string => !!v));
  const positionNames = new Set(rows.map((r) => r.positionTitle).filter((v): v is string => !!v));
  const managerCodes = new Set(rows.map((r) => r.managerEmployeeCode).filter((v): v is string => !!v));

  const [depts, positions, employees] = await Promise.all([
    deptCodes.size > 0
      ? prisma.department.findMany({ where: { code: { in: [...deptCodes] } }, select: { id: true, code: true } })
      : Promise.resolve([]),
    positionNames.size > 0
      ? prisma.position.findMany({ where: { name: { in: [...positionNames] } }, select: { id: true, name: true } })
      : Promise.resolve([]),
    managerCodes.size > 0
      ? prisma.employee.findMany({ where: { employeeCode: { in: [...managerCodes] } }, select: { id: true, employeeCode: true } })
      : Promise.resolve([]),
  ]);

  return {
    deptByCode: new Map(depts.map((d) => [d.code, d.id])),
    positionByName: new Map(positions.map((p) => [p.name, p.id])),
    employeeByCode: new Map(employees.map((e) => [e.employeeCode, e.id])),
  };
}

export async function bulkImportEmployees(
  csvText: string,
  caller: Caller,
  meta: RequestMeta,
): Promise<BulkImportResult> {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const rows: ImportRow[] = [];
  const errors: BulkImportResult["errors"] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const result = EmployeeCreateSchema.safeParse({
      employeeCode: raw.employeeCode?.trim(),
      email: raw.email?.trim(),
      firstNameTh: raw.firstNameTh?.trim(),
      lastNameTh: raw.lastNameTh?.trim(),
      hireDate: raw.hireDate?.trim(),
      firstNameEn: raw.firstNameEn?.trim() || undefined,
      lastNameEn: raw.lastNameEn?.trim() || undefined,
      phone: raw.phone?.trim() || undefined,
      workShift: raw.workShift?.trim() || "MORNING",
      employmentType: raw.employmentType?.trim() || undefined,
      baseSalary: raw.baseSalary?.trim() ? Number(raw.baseSalary.trim()) : undefined,
    });

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ rowIndex: i + 1, field: issue.path.join("."), message: issue.message });
      }
    } else {
      rows.push({
        rowIndex: i + 1,
        ...result.data,
        departmentCode: raw.departmentCode?.trim() || undefined,
        positionTitle: raw.positionTitle?.trim() || undefined,
        managerEmployeeCode: raw.managerEmployeeCode?.trim() || undefined,
      });
    }
  }

  if (errors.length > 0) {
    return { created: [], errors, totalRows: parsed.data.length };
  }

  const hasSensitive = rows.some((r) => r.baseSalary !== undefined || r.employmentType !== undefined);
  if (hasSensitive && !isSensitiveDataRole(caller.roles)) {
    throw new DomainError("INSUFFICIENT_PERMISSIONS", { fields: ["baseSalary", "employmentType"] }, 403);
  }

  const lookups = await buildLookupMaps(rows);

  // Validate FK references before opening the transaction
  for (const row of rows) {
    if (row.departmentCode && !lookups.deptByCode.has(row.departmentCode)) {
      errors.push({ rowIndex: row.rowIndex, field: "departmentCode", message: `Unknown department code: ${row.departmentCode}` });
    }
    if (row.positionTitle && !lookups.positionByName.has(row.positionTitle)) {
      errors.push({ rowIndex: row.rowIndex, field: "positionTitle", message: `Unknown position: ${row.positionTitle}` });
    }
    if (row.managerEmployeeCode && !lookups.employeeByCode.has(row.managerEmployeeCode)) {
      errors.push({ rowIndex: row.rowIndex, field: "managerEmployeeCode", message: `Unknown manager: ${row.managerEmployeeCode}` });
    }
  }

  if (errors.length > 0) {
    return { created: [], errors, totalRows: parsed.data.length };
  }

  // Pre-hash all passwords before entering the transaction
  const passwordMap = new Map<string, { plain: string; hash: string }>();
  await Promise.all(rows.map(async (row) => {
    const plain = generateInitialPassword(row.employeeCode);
    const hash = await hashPassword(plain);
    passwordMap.set(row.employeeCode, { plain, hash });
  }));

  const created: BulkImportResult["created"] = [];

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const pw = passwordMap.get(row.employeeCode)!;

      const user = await tx.user.create({
        data: { email: row.email, emailVerified: new Date(), passwordHash: pw.hash, mustChangePassword: true },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id, employeeCode: row.employeeCode,
          firstNameTh: row.firstNameTh, lastNameTh: row.lastNameTh,
          firstNameEn: row.firstNameEn, lastNameEn: row.lastNameEn,
          phone: row.phone, hireDate: new Date(row.hireDate),
          workShift: (row.workShift as "MORNING" | "EVENING") ?? "MORNING",
          departmentId: row.departmentCode ? lookups.deptByCode.get(row.departmentCode) : undefined,
          positionId: row.positionTitle ? lookups.positionByName.get(row.positionTitle) : undefined,
          managerId: row.managerEmployeeCode ? lookups.employeeByCode.get(row.managerEmployeeCode) : undefined,
          employmentType: row.employmentType,
          baseSalary: row.baseSalary !== undefined ? new Prisma.Decimal(row.baseSalary) : null,
        },
      });

      if (row.baseSalary !== undefined) {
        await tx.salaryAdjustment.create({
          data: {
            employeeId: employee.id, effectiveDate: new Date(row.hireDate),
            adjustmentType: "INITIAL",
            salaryBefore: null, salaryAfter: new Prisma.Decimal(row.baseSalary),
            ratePct: null, actorId: caller.userId,
          },
        });
      }

      await grantInitialLeaveQuota(employee.id, new Date(row.hireDate), tx);
      await createChecklistForEmployee(employee.id, undefined, tx);

      created.push({ rowIndex: row.rowIndex, employeeCode: row.employeeCode, initialPassword: pw.plain });
    }

    await writeAuditLog({
      actorId: caller.userId, action: "employee.bulk_import",
      entityType: "Employee", entityId: "bulk",
      after: { count: created.length, codes: created.map((c) => c.employeeCode) },
      ipAddress: meta.ip, userAgent: meta.userAgent,
    }, tx);
  });

  return { created, errors: [], totalRows: parsed.data.length };
}
