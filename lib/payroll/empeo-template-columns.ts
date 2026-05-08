// Decoded column layout from public/Payroll_Info_Period_3_08052026.xlsx.
// The numeric tokens after `|` are Empeo's internal field IDs and must be
// preserved verbatim — Empeo uses them to map the import back.
import type { EmpeoEmployeeRow } from "./empeo-period-aggregator";

export type EmpeoFieldKey = keyof EmpeoEmployeeRow | "blank" | "empRefId";

export interface EmpeoColumn {
  /** Spreadsheet column letter (A, B, ..., BA). */
  col: string;
  /** Header text exactly as Empeo's template (Thai + Empeo internal id). */
  header: string;
  field: EmpeoFieldKey;
  /** Render value with trailing `*` to disable Empeo's recompute. */
  isAmount: boolean;
  width: number;
}

export const EMPEO_COLUMNS: readonly EmpeoColumn[] = [
  { col: "A", header: "รหัสอ้างอิงพนักงาน", field: "empRefId", isAmount: false, width: 16 },
  { col: "B", header: "รหัสพนักงาน", field: "employeeCode", isAmount: false, width: 12 },
  { col: "C", header: "ชื่อพนักงาน", field: "fullNameTh", isAmount: false, width: 20 },
  { col: "D", header: "บริษัท", field: "company", isAmount: false, width: 28 },
  { col: "E", header: "ระดับ", field: "level", isAmount: false, width: 12 },
  { col: "F", header: "เงินได้สุทธิ", field: "blank", isAmount: false, width: 14 },
  { col: "G", header: "เงินเดือนต่องวด", field: "blank", isAmount: false, width: 14 },
  // Income columns from H onwards — amounts only beyond this point.
  { col: "H", header: "เงินเดือน / ค่าจ้างรายวัน | 1494722", field: "blank", isAmount: true, width: 28 },
  { col: "I", header: "ค่าล่วงเวลา | 1494720", field: "otWeekday", isAmount: true, width: 18 },
  { col: "J", header: "ค่าวิชาชีพ | 1494677", field: "blank", isAmount: true, width: 16 },
  { col: "K", header: "โบนัส | 1494721", field: "blank", isAmount: true, width: 13 },
  { col: "L", header: "ค่ากะ | 1494681", field: "blank", isAmount: true, width: 13 },
  { col: "M", header: "ค่ากะพิเศษ (OT) | 1494682", field: "blank", isAmount: true, width: 21 },
  { col: "N", header: "ค่ากะพิเศษ (วันหยุด) | 1494683", field: "otHoliday", isAmount: true, width: 24 },
  { col: "O", header: "ค่ากะพิเศษจากเวลาทำงาน | 1494687", field: "otHolidayWork", isAmount: true, width: 27 },
  { col: "P", header: "เบี้ยขยัน | 1494684", field: "blank", isAmount: true, width: 16 },
  { col: "Q", header: "เบี้ยขยันพิเศษ | 1494685", field: "blank", isAmount: true, width: 20 },
  { col: "R", header: "เงินสวัสดิการรักษาพยาบาล | 1494716", field: "blank", isAmount: true, width: 29 },
  { col: "S", header: "ค่าควบกะ | 1494711", field: "blank", isAmount: true, width: 15 },
  { col: "T", header: "คืนเงินวันลาคงเหลือ | 1494708", field: "cashoutAmount", isAmount: true, width: 25 },
  { col: "U", header: "เงินชดเชย | 1494693", field: "blank", isAmount: true, width: 16 },
  { col: "V", header: "ภาษีบริษัทออกให้ | 1494694", field: "blank", isAmount: true, width: 22 },
  { col: "W", header: "EJIP บริษัทสมทบ | 1494696", field: "blank", isAmount: true, width: 21 },
  { col: "X", header: "รางวัล | 1494703", field: "blank", isAmount: true, width: 14 },
  { col: "Y", header: "*เงินชดเชยเลิกจ้าง | 1494678", field: "blank", isAmount: true, width: 24 },
  { col: "Z", header: "*เงินได้อื่นๆ | 1494671", field: "expenseReimburse", isAmount: true, width: 20 },
  { col: "AA", header: "ตกเบิกปรับเงินเดือน | 1494715", field: "blank", isAmount: true, width: 25 },
  { col: "AB", header: "ตกเบิกค่าล่วงเวลา | 1494706", field: "blank", isAmount: true, width: 23 },
  { col: "AC", header: "ตกเบิกขาดลามาสาย | 1494705", field: "blank", isAmount: true, width: 22 },
  { col: "AD", header: "ตกเบิกสวัสดิการ | 1494723", field: "blank", isAmount: true, width: 21 },
  { col: "AE", header: "*เบิกเงินล่วงหน้า | 1494692", field: "blank", isAmount: true, width: 24 },
  { col: "AF", header: "ภาษีหัก ณ ที่จ่าย | 1494676", field: "blank", isAmount: true, width: 20 },
  { col: "AG", header: "หักประกันสังคม | 1494670", field: "blank", isAmount: true, width: 19 },
  { col: "AH", header: "หักลาไม่รับค่าจ้าง | 1494680", field: "lwpDeduction", isAmount: true, width: 22 },
  { col: "AI", header: "หักไม่มาทำงาน | 1494673", field: "absentDeduction", isAmount: true, width: 18 },
  { col: "AJ", header: "หักสวัสดิการ | 1494698", field: "blank", isAmount: true, width: 17 },
  { col: "AK", header: "กองทุนสำรองเลี้ยงชีพ (บริษัท) | 1494704", field: "blank", isAmount: true, width: 32 },
  { col: "AL", header: "หักพักงาน | 1494718", field: "blank", isAmount: true, width: 16 },
  { col: "AM", header: "กองทุนสำรองเลี้ยงชีพ | 1494672", field: "blank", isAmount: true, width: 25 },
  { col: "AN", header: "ค่าปรับ | 1494686", field: "blank", isAmount: true, width: 14 },
  { col: "AO", header: "ภาษีหัก 40(1) หัก 3% | 1494688", field: "blank", isAmount: true, width: 24 },
  { col: "AP", header: "ภาษีเลิกจ้าง | 1494689", field: "blank", isAmount: true, width: 18 },
  { col: "AQ", header: "ภาษีหัก 40(2) อยู่ในไทย | 1494690", field: "blank", isAmount: true, width: 26 },
  { col: "AR", header: "ภาษี 40(5) | 1494691", field: "blank", isAmount: true, width: 16 },
  { col: "AS", header: "ภาษี 40(6) | 1494709", field: "blank", isAmount: true, width: 16 },
  { col: "AT", header: "เงินกู้ กยศ. | 1494713", field: "blank", isAmount: true, width: 18 },
  { col: "AU", header: "*เงินหักอื่นๆ | 1494675", field: "blank", isAmount: true, width: 19 },
  { col: "AV", header: "กรมบังคดี | 1494712", field: "blank", isAmount: true, width: 16 },
  { col: "AW", header: "เงินหักวันลาเกินสิทธิ์ | 1494707", field: "blank", isAmount: true, width: 27 },
  { col: "AX", header: "ภาษีบริษัทออกให้ | 1494701", field: "blank", isAmount: true, width: 22 },
  { col: "AY", header: "EJIP พนักงานสะสม | 1494695", field: "blank", isAmount: true, width: 21 },
  { col: "AZ", header: "EJIP ภาษีหัก ณ ที่จ่ายบริษัท | 1494699", field: "blank", isAmount: true, width: 30 },
  { col: "BA", header: "การดำเนินการปรับเงินเดือน", field: "blank", isAmount: false, width: 71 },
];
