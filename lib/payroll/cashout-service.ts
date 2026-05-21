// ════════════════════════════════════════════════════════════════
// Cashout Service — list / export annual leave cashout data
// ════════════════════════════════════════════════════════════════

import { getPrisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { Caller, RequestMeta } from "@/lib/api/types";

const CSV_HEADER = "﻿รหัสพนักงาน,ชื่อ-สกุล,ปี,จำนวนวันที่เหลือ,ประเภท";

export async function listCashouts(year: number) {
  const prisma = await getPrisma();
  return prisma.annualLeaveCashOut.findMany({
    where: { year },
    include: {
      employee: {
        select: { firstNameTh: true, lastNameTh: true, employeeCode: true },
      },
    },
    orderBy: [{ exportStatus: "asc" }, { employee: { employeeCode: "asc" } }],
  });
}

export async function markCashoutExported(
  caller: Caller,
  cashoutId: string,
  meta: RequestMeta,
) {
  const prisma = await getPrisma();
  return prisma.$transaction(async (tx) => {
    const record = await tx.annualLeaveCashOut.findUnique({ where: { id: cashoutId } });
    if (!record) throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
    if (record.exportStatus !== "PENDING") {
      throw new DomainError(ErrorCodes.ALREADY_PROCESSED, { status: record.exportStatus });
    }

    const updated = await tx.annualLeaveCashOut.update({
      where: { id: cashoutId },
      data: { exportStatus: "EXPORTED", exportedAt: new Date() },
    });

    await writeAuditLog({
      actorId: caller.userId,
      action: "payroll.cashout_exported",
      entityType: "AnnualLeaveCashOut",
      entityId: cashoutId,
      before: record,
      after: updated,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }, tx);

    return updated;
  });
}

export async function exportCashout(year: number): Promise<string> {
  const prisma = await getPrisma();
  const cashOuts = await prisma.annualLeaveCashOut.findMany({
    where: { year },
    include: {
      employee: {
        select: { employeeCode: true, firstNameTh: true, lastNameTh: true },
      },
    },
    orderBy: { employee: { employeeCode: "asc" } },
  });

  const lines = [CSV_HEADER];
  for (const c of cashOuts) {
    const name = `${c.employee.firstNameTh} ${c.employee.lastNameTh}`;
    lines.push(
      `${c.employee.employeeCode},${name},${c.year},${c.unusedDays.toString()},${c.trigger}`,
    );
  }

  return lines.join("\n");
}
