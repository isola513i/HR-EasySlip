/**
 * Generates public/Employee_Data_Report_All_Resign_Inc_08052026.xlsx
 * — a minimal Empeo-format fixture for e2e dry-run import tests.
 *
 * Rows:
 *   EXT001, EXT002 → สถานะ "ทำงาน" (ACTIVE)  → imported
 *   EXT003         → สถานะ "ลาออก" (RESIGNED) → skipped (NOT_ACTIVE)
 */

import ExcelJS from "exceljs";
import path from "path";
import fs from "fs/promises";

const FIXTURE_PATH = path.join(process.cwd(), "public", "Employee_Data_Report_All_Resign_Inc_08052026.xlsx");

const HEADERS = [
  "รหัส", "ชื่อ", "นามสกุล", "ชื่อ (EN)", "นามสกุล (EN)",
  "ประเภทการจ้างงาน", "เลขที่บัตรประจำตัว", "สถานะ", "วันเริ่มทำงาน",
  "อีเมลบริษัท", "อีเมลส่วนตัว", "กะการทำงาน",
  "ชื่อตำแหน่ง", "รหัสฝ่าย", "ฝ่าย", "รหัสหัวหน้า", "โทรศัพท์",
];

const ROWS = [
  // 2 ACTIVE employees — included in dry-run preview
  ["EXT001", "สมหมาย", "จริงใจ", "Sommai", "Jingjai",
   "รายเดือน", "1101234567001", "ทำงาน", "01/06/2020",
   "sommai.j@e2etest.invalid", "", "เช้า",
   "Software Developer", "ENG", "Engineering", "ES0006", "0812345001"],
  ["EXT002", "แพรวา", "สุขสันต์", "Phraewa", "Suksun",
   "รายเดือน", "1101234567002", "ทำงาน", "15/03/2022",
   "phraewa.s@e2etest.invalid", "", "เช้า",
   "Product Designer", "DSGN", "Design", "ES0007", "0812345002"],
  // 1 RESIGNED employee — skipped (NOT_ACTIVE)
  ["EXT003", "เกษม", "หายไป", "Kasem", "Haipai",
   "รายเดือน", "1101234567003", "ลาออก", "01/01/2019",
   "kasem.h@e2etest.invalid", "", "เช้า",
   "", "", "", "", ""],
];

export async function generateEmpeoFixture(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Employee Data");

  ws.addRow(HEADERS);
  for (const row of ROWS) ws.addRow(row);

  await fs.mkdir(path.dirname(FIXTURE_PATH), { recursive: true });
  await wb.xlsx.writeFile(FIXTURE_PATH);
}
