import ExcelJS from "exceljs";
import { getPrisma } from "@/lib/prisma";

const COMPANY_NAME = "บริษัท โกไฟว์ จำกัด";

const INCOME_HEADERS = [
  "รหัสอ้างอิงพนักงาน", "รหัสพนักงาน", "ชื่อพนักงาน", "บริษัท", "ระดับ",
  "เงินได้สุทธิ", "เงินเดือนต่องวด",
  "เงินเดือน / ค่าจ้างรายวัน", "ค่าล่วงเวลา (1.5x)",
  "ค่าวิชาชีพ", "โบนัส", "ค่ากะ", "ค่ากะพิเศษ (OT)",
  "ค่ากะพิเศษ (วันหยุด) (3x)", "ค่ากะพิเศษจากเวลาทำงาน",
  "เบี้ยขยัน", "เบี้ยขยันพิเศษ",
];

interface OTBucket { weekday: number; holiday: number }

export async function generatePayrollInfoExcel(
  cycleId: string,
): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const prisma = await getPrisma();
  const cycle = await prisma.payrollCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new Error("Cycle not found");

  const employees = await prisma.employee.findMany({
    where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
    include: { position: { select: { name: true } } },
    orderBy: { employeeCode: "asc" },
  });

  const otRequests = await prisma.overtimeRequest.findMany({
    where: { status: "APPROVED", date: { gte: cycle.cycleStart, lte: cycle.cycleEnd } },
    select: { employeeId: true, hoursApproved: true, overtimeType: true },
  });

  // Split OT by type: weekday (1.5x) vs holiday (3.0x)
  const otByEmployee = new Map<string, OTBucket>();
  for (const ot of otRequests) {
    if (!ot.hoursApproved) continue;
    const bucket = otByEmployee.get(ot.employeeId) ?? { weekday: 0, holiday: 0 };
    if (ot.overtimeType === "WEEKDAY") {
      bucket.weekday += ot.hoursApproved.toNumber();
    } else {
      bucket.holiday += ot.hoursApproved.toNumber();
    }
    otByEmployee.set(ot.employeeId, bucket);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ข้อมูลเงินเดือน");

  const metaRow = ws.addRow([` ${COMPANY_NAME} `, "", ` งวดที่ `, String(cycle.month), ` ปี `, String(cycle.year)]);
  metaRow.font = { bold: true };

  ws.addRow(INCOME_HEADERS);
  ws.getRow(2).font = { bold: true };

  for (const emp of employees) {
    const ot = otByEmployee.get(emp.id) ?? { weekday: 0, holiday: 0 };
    ws.addRow([
      "", emp.employeeCode, `${emp.firstNameTh} ${emp.lastNameTh}`,
      COMPANY_NAME, emp.position?.name ?? "",
      "0.00", "0.00", "0.00",
      ot.weekday > 0 ? ot.weekday.toFixed(2) : "0.00",   // ค่าล่วงเวลา (1.5x)
      "0.00", "0.00", "0.00", "0.00",
      ot.holiday > 0 ? ot.holiday.toFixed(2) : "0.00",    // ค่ากะพิเศษ (วันหยุด) (3x)
      "0.00", "0.00", "0.00",
    ]);
  }

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const filename = `Payroll_Info_Period_${cycle.month}_${dd}${mm}${now.getFullYear()}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer() as ArrayBuffer;
  return { buffer, filename };
}
