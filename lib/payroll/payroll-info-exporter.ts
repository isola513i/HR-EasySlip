import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";

const COMPANY_NAME = "บริษัท โกไฟว์ จำกัด";

const INCOME_HEADERS = [
  "รหัสอ้างอิงพนักงาน", "รหัสพนักงาน", "ชื่อพนักงาน", "บริษัท", "ระดับ",
  "เงินได้สุทธิ", "เงินเดือนต่องวด",
  "เงินเดือน / ค่าจ้างรายวัน", "ค่าล่วงเวลา",
  "ค่าวิชาชีพ", "โบนัส", "ค่ากะ", "ค่ากะพิเศษ (OT)",
  "ค่ากะพิเศษ (วันหยุด)", "ค่ากะพิเศษจากเวลาทำงาน",
  "เบี้ยขยัน", "เบี้ยขยันพิเศษ",
];

export async function generatePayrollInfoExcel(
  cycleId: string,
): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const cycle = await prisma.payrollCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new Error("Cycle not found");

  const employees = await prisma.employee.findMany({
    where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
    include: { position: { select: { name: true } } },
    orderBy: { employeeCode: "asc" },
  });

  // Get approved OT hours for this cycle period
  const otRequests = await prisma.overtimeRequest.findMany({
    where: {
      status: "APPROVED",
      date: { gte: cycle.cycleStart, lte: cycle.cycleEnd },
    },
    select: { employeeId: true, hoursApproved: true, rateMultiplier: true },
  });

  const otByEmployee = new Map<string, number>();
  for (const ot of otRequests) {
    if (!ot.hoursApproved) continue;
    const current = otByEmployee.get(ot.employeeId) ?? 0;
    otByEmployee.set(ot.employeeId, current + ot.hoursApproved.toNumber());
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ข้อมูลเงินเดือน");

  // Row 1: metadata
  const metaRow = ws.addRow([
    ` ${COMPANY_NAME} `, "", ` งวดที่ `, String(cycle.month), ` ปี `, String(cycle.year),
  ]);
  metaRow.font = { bold: true };

  // Row 2: headers
  ws.addRow(INCOME_HEADERS);
  ws.getRow(2).font = { bold: true };

  // Row 3+: employee data
  for (const emp of employees) {
    const otHours = otByEmployee.get(emp.id) ?? 0;
    ws.addRow([
      "", // รหัสอ้างอิง (Empeo internal)
      emp.employeeCode,
      `${emp.firstNameTh} ${emp.lastNameTh}`,
      COMPANY_NAME,
      emp.position?.name ?? "",
      "0.00", // เงินได้สุทธิ — Empeo calculates
      "0.00", // เงินเดือน — not in our system
      "0.00", // ค่าจ้างรายวัน
      otHours > 0 ? otHours.toFixed(2) : "0.00", // ค่าล่วงเวลา
      "0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00",
    ]);
  }

  const dd = String(new Date().getDate()).padStart(2, "0");
  const mm = String(new Date().getMonth() + 1).padStart(2, "0");
  const yyyy = new Date().getFullYear();
  const filename = `Payroll_Info_Period_${cycle.month}_${dd}${mm}${yyyy}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer() as ArrayBuffer;
  return { buffer, filename };
}
