import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { hashPassword, generateInitialPassword } from "@/lib/auth/password-utils";
import { grantInitialLeaveQuota } from "@/lib/leave/leave-quota-grant-service";
import { createChecklistForEmployee } from "@/lib/onboarding/checklist-service";
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
}

interface BulkImportResult {
  created: { rowIndex: number; employeeCode: string; initialPassword: string }[];
  errors: { rowIndex: number; field?: string; message: string }[];
  totalRows: number;
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
    });

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ rowIndex: i + 1, field: issue.path.join("."), message: issue.message });
      }
    } else {
      rows.push({ rowIndex: i + 1, ...result.data });
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
        },
      });

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
