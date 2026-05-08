import ExcelJS from "exceljs";
import type { Decimal } from "@prisma/client/runtime/library";
import { aggregatePeriod, type EmpeoEmployeeRow } from "./empeo-period-aggregator";
import { EMPEO_COLUMNS, type EmpeoColumn } from "./empeo-template-columns";

const SHEET_NAME = "Payroll Period";

function fmtAmount(v: Decimal | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const n = typeof v === "number" ? v : Number(v.toString());
  if (n === 0) return "";
  // Trailing `*` tells Empeo to lock the value (skip recompute).
  return `${n.toFixed(2)}*`;
}

function valueFor(col: EmpeoColumn, row: EmpeoEmployeeRow): string {
  if (col.field === "blank") return "";
  if (col.field === "empRefId") return "";
  if (col.field === "employeeCode") return row.employeeCode;
  if (col.field === "fullNameTh") return row.fullNameTh;
  if (col.field === "company") return row.company;
  if (col.field === "level") return row.level;
  if (col.field === "employmentType") return row.employmentType ?? "";
  // Amount fields
  return fmtAmount(row[col.field] as Decimal | null);
}

export async function generateEmpeoTemplateExcel(
  cycleId: string,
): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const period = await aggregatePeriod(cycleId);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(SHEET_NAME);

  // Row 1 — period header (mimic Empeo's template metadata band)
  const company = period.rows[0]?.company ?? "EasySlip HR";
  ws.getCell("A1").value = "บริษัท";
  ws.getCell("B1").value = company;
  ws.getCell("C1").value = "งวดที่";
  ws.getCell("D1").value = period.month;
  ws.getCell("E1").value = "ปี";
  ws.getCell("F1").value = period.year;
  ws.mergeCells("G1:O1");
  ws.getCell("G1").value =
    "ไม่ต้องการให้ระบบคำนวณ กรุณาเติม * หลังยอดที่ต้องการ เช่น 500.00* หมายเหตุ ยอดเงินสามารถแก้ไขได้ตั้งแต่คอลัมน์ H เป็นต้นไป";

  // Row 2 — column headers
  for (const col of EMPEO_COLUMNS) {
    const cell = ws.getCell(`${col.col}2`);
    cell.value = col.header;
    cell.font = { bold: true };
    cell.alignment = { wrapText: true, vertical: "middle" };
    ws.getColumn(col.col).width = col.width;
  }

  // Row 3+ — employee rows
  let rowNum = 3;
  for (const r of period.rows) {
    for (const col of EMPEO_COLUMNS) {
      const cell = ws.getCell(`${col.col}${rowNum}`);
      const v = valueFor(col, r);
      cell.value = v;
      // Force string formatting so Excel doesn't strip the trailing *.
      cell.numFmt = "@";
    }
    rowNum++;
  }

  const buffer = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  const dd = String(period.cycleEnd.getDate()).padStart(2, "0");
  const mm = String(period.cycleEnd.getMonth() + 1).padStart(2, "0");
  const yyyy = period.cycleEnd.getFullYear();
  const filename = `Payroll_Info_Period_${period.month}_${dd}${mm}${yyyy}.xlsx`;

  return { buffer, filename };
}
