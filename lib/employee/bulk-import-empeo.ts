import ExcelJS from "exceljs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { hashPassword, generateInitialPassword } from "@/lib/auth/password-utils";
import { grantInitialLeaveQuota } from "@/lib/leave/leave-quota-grant-service";
import { createChecklistForEmployee } from "@/lib/onboarding/checklist-service";
import { isSensitiveDataRole } from "@/lib/security/role-helpers";
import { DomainError } from "@/lib/api/errors";
import { detectEmpeoFormat, mapEmpeoRow, type EmpeoMappedRow } from "./empeo-import-mapper";
import type { Caller, RequestMeta } from "@/lib/api/types";

export interface EmpeoImportResult {
  format: "empeo-xlsx";
  created: { rowIndex: number; employeeCode: string; initialPassword: string }[];
  skipped: { rowIndex: number; reason: string; message: string }[];
  errors: { rowIndex: number; field?: string; message: string }[];
  newDepartments: string[];
  newPositions: string[];
  totalRows: number;
}

interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

async function readSheet(buffer: ArrayBuffer): Promise<ParsedSheet> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new DomainError("EMPTY_WORKBOOK", {}, 400);

  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    headers[col - 1] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, string>[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const obj: Record<string, string> = {};
    let hasAny = false;
    headers.forEach((h, idx) => {
      const v = ws.getRow(r).getCell(idx + 1).value;
      const text = v == null ? "" : String(typeof v === "object" && "text" in (v as object) ? (v as { text: string }).text : v);
      obj[h] = text;
      if (text.trim()) hasAny = true;
    });
    if (hasAny) rows.push(obj);
  }
  return { headers, rows };
}

export async function bulkImportEmpeoXlsx(
  buffer: ArrayBuffer,
  caller: Caller,
  meta: RequestMeta,
  opts: { dryRun?: boolean } = {},
): Promise<EmpeoImportResult> {
  const sheet = await readSheet(buffer);
  if (!detectEmpeoFormat(sheet.headers)) {
    throw new DomainError("NOT_EMPEO_FORMAT", { headers: sheet.headers.slice(0, 10) }, 400);
  }

  const mapped: { rowIndex: number; row: EmpeoMappedRow }[] = [];
  const skipped: EmpeoImportResult["skipped"] = [];

  sheet.rows.forEach((raw, i) => {
    const result = mapEmpeoRow(raw);
    const rowIndex = i + 2; // 1-indexed + header row
    if (!result.ok) {
      skipped.push({ rowIndex, reason: result.reason, message: result.message });
    } else {
      mapped.push({ rowIndex, row: result.row });
    }
  });

  const errors: EmpeoImportResult["errors"] = [];
  const seenCodes = new Set<string>();
  for (const { rowIndex, row } of mapped) {
    if (seenCodes.has(row.employeeCode)) {
      errors.push({ rowIndex, field: "employeeCode", message: `Duplicate code: ${row.employeeCode}` });
    } else {
      seenCodes.add(row.employeeCode);
    }
  }
  const existingCodes = await prisma.employee.findMany({
    where: { employeeCode: { in: [...seenCodes] } }, select: { employeeCode: true },
  });
  for (const e of existingCodes) {
    const found = mapped.find((m) => m.row.employeeCode === e.employeeCode);
    if (found) errors.push({ rowIndex: found.rowIndex, field: "employeeCode", message: `Already exists: ${e.employeeCode}` });
  }

  const deptCodes = new Set(mapped.map((m) => m.row.departmentCode).filter((v): v is string => !!v));
  const positionNames = new Set(mapped.map((m) => m.row.positionTitle).filter((v): v is string => !!v));
  const existingDepts = await prisma.department.findMany({
    where: { code: { in: [...deptCodes] } }, select: { id: true, code: true },
  });
  const existingPositions = await prisma.position.findMany({
    where: { name: { in: [...positionNames] } }, select: { id: true, name: true },
  });
  const newDepartments = [...deptCodes].filter((c) => !existingDepts.find((d) => d.code === c));
  const newPositions = [...positionNames].filter((n) => !existingPositions.find((p) => p.name === n));

  if (mapped.some((m) => m.row.employmentType !== undefined) && !isSensitiveDataRole(caller.roles)) {
    throw new DomainError("INSUFFICIENT_PERMISSIONS", { fields: ["employmentType"] }, 403);
  }

  if (opts.dryRun || errors.length > 0) {
    return {
      format: "empeo-xlsx",
      created: [],
      skipped,
      errors,
      newDepartments,
      newPositions,
      totalRows: sheet.rows.length,
    };
  }

  const passwordMap = new Map<string, { plain: string; hash: string }>();
  await Promise.all(mapped.map(async ({ row }) => {
    const plain = generateInitialPassword(row.employeeCode);
    const hash = await hashPassword(plain);
    passwordMap.set(row.employeeCode, { plain, hash });
  }));

  const created = await prisma.$transaction(async (tx) => {
    const deptByCode = new Map(existingDepts.map((d) => [d.code, d.id]));
    for (const code of newDepartments) {
      const sample = mapped.find((m) => m.row.departmentCode === code)?.row;
      const dept = await tx.department.create({
        data: { code, name: sample?.departmentName ?? code },
      });
      deptByCode.set(code, dept.id);
    }
    const positionByName = new Map(existingPositions.map((p) => [p.name, p.id]));
    for (const name of newPositions) {
      const pos = await tx.position.create({ data: { name } });
      positionByName.set(name, pos.id);
    }

    const createdEmployees: EmpeoImportResult["created"] = [];
    const employeeByCode = new Map<string, string>();

    // Pass 1 — create users + employees without managerId
    for (const { rowIndex, row } of mapped) {
      const pw = passwordMap.get(row.employeeCode)!;
      const user = await tx.user.create({
        data: { email: row.email, emailVerified: new Date(), passwordHash: pw.hash, mustChangePassword: true },
      });
      const emp = await tx.employee.create({
        data: {
          userId: user.id, employeeCode: row.employeeCode,
          firstNameTh: row.firstNameTh, lastNameTh: row.lastNameTh,
          firstNameEn: row.firstNameEn, lastNameEn: row.lastNameEn,
          phone: row.phone, hireDate: new Date(row.hireDate),
          workShift: row.workShift,
          employmentStatus: row.employmentStatus,
          employmentType: row.employmentType,
          departmentId: row.departmentCode ? deptByCode.get(row.departmentCode) : undefined,
          positionId: row.positionTitle ? positionByName.get(row.positionTitle) : undefined,
        },
      });
      await grantInitialLeaveQuota(emp.id, new Date(row.hireDate), tx);
      await createChecklistForEmployee(emp.id, undefined, tx);
      employeeByCode.set(row.employeeCode, emp.id);
      createdEmployees.push({ rowIndex, employeeCode: row.employeeCode, initialPassword: pw.plain });
    }

    // Pass 2 — link managers (manager may be in same import batch).
    for (const { row } of mapped) {
      if (!row.managerEmployeeCode) continue;
      const mgrId = employeeByCode.get(row.managerEmployeeCode)
        ?? (await tx.employee.findUnique({ where: { employeeCode: row.managerEmployeeCode }, select: { id: true } }))?.id;
      if (mgrId) {
        await tx.employee.update({
          where: { employeeCode: row.employeeCode },
          data: { managerId: mgrId },
        });
      }
    }

    await writeAuditLog({
      actorId: caller.userId, action: "employee.bulk_import_empeo",
      entityType: "Employee", entityId: "bulk",
      after: {
        count: createdEmployees.length,
        skippedCount: skipped.length,
        newDepartments, newPositions,
      },
      ipAddress: meta.ip, userAgent: meta.userAgent,
    }, tx);

    return createdEmployees;
  });

  return {
    format: "empeo-xlsx",
    created,
    skipped,
    errors: [],
    newDepartments,
    newPositions,
    totalRows: sheet.rows.length,
  };
}
