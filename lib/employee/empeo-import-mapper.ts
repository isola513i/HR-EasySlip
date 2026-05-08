import type { EmploymentStatus } from "@prisma/client";

export type EasySlipEmploymentType = "MONTHLY" | "DAILY" | "INTERN";

export interface EmpeoMappedRow {
  employeeCode: string;
  email: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn?: string;
  lastNameEn?: string;
  hireDate: string;
  phone?: string;
  workShift: "MORNING" | "EVENING";
  positionTitle?: string;
  departmentCode?: string;
  departmentName?: string;
  managerEmployeeCode?: string;
  employmentType?: EasySlipEmploymentType;
  employmentStatus: EmploymentStatus;
}

export type SkipReason = "NOT_ACTIVE" | "MISSING_REQUIRED";

const STATUS_MAP: Record<string, EmploymentStatus> = {
  "ทดลองงาน": "PROBATION",
  "ทำงาน": "ACTIVE",
  "พักงาน": "SUSPENDED",
  "ลาออก": "RESIGNED",
  "พ้นสภาพ": "TERMINATED",
  "เกษียณ": "RETIRED",
  "สิ้นสุดสัญญา": "CONTRACT_ENDED",
};

const TYPE_MAP: Record<string, EasySlipEmploymentType> = {
  "รายเดือน": "MONTHLY",
  "รายวัน": "DAILY",
  "ฝึกงาน": "INTERN",
};

const EMPEO_HEADERS = ["รหัส", "ประเภทการจ้างงาน", "เลขที่บัตรประจำตัว"] as const;

export function detectEmpeoFormat(headers: readonly string[]): boolean {
  const set = new Set(headers.map((h) => h.trim()));
  return EMPEO_HEADERS.every((h) => set.has(h));
}

function inferShift(raw: string | undefined): "MORNING" | "EVENING" {
  if (!raw) return "MORNING";
  const lower = raw.toLowerCase();
  if (/17|18|19|20|21|22|23|เย็น|evening|night/.test(lower)) return "EVENING";
  return "MORNING";
}

function parseEmpeoDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  let yyyy = Number(m[3]);
  // Empeo emits Buddhist year (e.g. 2569) — convert when > 2400.
  if (yyyy > 2400) yyyy -= 543;
  return `${yyyy}-${mm}-${dd}`;
}

interface MapResult {
  ok: true;
  row: EmpeoMappedRow;
}
interface SkipResult {
  ok: false;
  reason: SkipReason;
  message: string;
}

export function mapEmpeoRow(raw: Record<string, string>): MapResult | SkipResult {
  const get = (k: string) => raw[k]?.trim() || undefined;

  const status = STATUS_MAP[get("สถานะ") ?? ""] ?? "ACTIVE";
  if (status !== "ACTIVE" && status !== "PROBATION") {
    return { ok: false, reason: "NOT_ACTIVE", message: `Skipped (status: ${get("สถานะ")})` };
  }

  const employeeCode = get("รหัส");
  const firstNameTh = get("ชื่อ");
  const lastNameTh = get("นามสกุล");
  const hireDate = parseEmpeoDate(get("วันเริ่มทำงาน"));
  const email = get("อีเมลบริษัท") ?? get("อีเมลส่วนตัว");

  if (!employeeCode || !firstNameTh || !lastNameTh || !hireDate || !email) {
    return {
      ok: false,
      reason: "MISSING_REQUIRED",
      message: "Missing employeeCode / name / hireDate / email",
    };
  }

  return {
    ok: true,
    row: {
      employeeCode,
      email,
      firstNameTh,
      lastNameTh,
      firstNameEn: get("ชื่อ (EN)"),
      lastNameEn: get("นามสกุล (EN)"),
      hireDate,
      phone: get("โทรศัพท์"),
      workShift: inferShift(get("กะการทำงาน")),
      positionTitle: get("ชื่อตำแหน่ง"),
      departmentCode: get("รหัสฝ่าย"),
      departmentName: get("ฝ่าย"),
      managerEmployeeCode: get("รหัสหัวหน้า"),
      employmentType: TYPE_MAP[get("ประเภทการจ้างงาน") ?? ""],
      employmentStatus: status,
    },
  };
}
