// ════════════════════════════════════════════════════════════════
// Cashout Service — export annual leave cashout data
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";

const CSV_HEADER = "\uFEFFรหัสพนักงาน,ชื่อ-สกุล,ปี,จำนวนวันที่เหลือ,ประเภท";

export async function exportCashout(year: number): Promise<string> {
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
