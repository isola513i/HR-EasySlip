import ExcelJS from "exceljs";
import { getPrisma } from "@/lib/prisma";
import { getControlPlane } from "@/lib/db/control-plane";

const HEADERS = [
  "รหัสพนักงาน", "วันเริ่มงาน", "คำนำหน้า", "เพศ",
  "ชื่อ (TH)", "นามสกุล (TH)", "ชื่อ (EN)", "นามสกุล (EN)",
  "ชื่อเล่น (TH)", "ชื่อเล่น (EN)", "เลขบัตรประชาชน", "อีเมล",
  "ระดับ", "ตำแหน่ง", "บริษัท", "แผนก",
  "สถานะพนักงาน", "ประเภทการจ้างงาน", "รหัสหัวหน้างาน", "กะการทำงาน",
  "วันเกิด", "สัญชาติ", "ศาสนา", "สถานะสมรส", "ทหาร", "กรุ๊ปเลือด",
  "ประกันสังคม", "รหัส รพ.",
  "เบอร์โทร", "อีเมลส่วนตัว", "LINE ID",
  "ที่อยู่ทะเบียนบ้าน", "จังหวัด(ทะเบียน)", "ที่อยู่ปัจจุบัน", "จังหวัด(ปัจจุบัน)",
  "ชื่อผู้ติดต่อฉุกเฉิน", "ความสัมพันธ์", "เบอร์ฉุกเฉิน",
];

const STATUS_MAP: Record<string, string> = {
  ACTIVE: "บรรจุ", PROBATION: "ทดลองงาน", SUSPENDED: "พักงาน",
  RESIGNED: "ลาออก", TERMINATED: "พ้นสภาพ",
  RETIRED: "เกษียณ", CONTRACT_ENDED: "สิ้นสุดสัญญา",
};

function fmtDate(d: Date | null): string {
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export async function generateEmployeeDataExcel(): Promise<ArrayBuffer> {
  const prisma = await getPrisma();
  const employees = await prisma.employee.findMany({
    where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
    include: {
      department: { select: { name: true } },
      position: { select: { name: true } },
      manager: { select: { employeeCode: true } },
    },
    orderBy: { employeeCode: "asc" },
  });

  const userIds = employees.map((e) => e.userId).filter((id): id is string => !!id);
  const cp = getControlPlane();
  const cpUsers = await cp.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });
  const emailById = new Map(cpUsers.map((u) => [u.id, u.email]));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("พนักงาน");

  const headerRow = ws.addRow(HEADERS);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EAF6" } };
  });
  HEADERS.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(h.length * 2, 14); });

  for (const e of employees) {
    ws.addRow([
      e.employeeCode, fmtDate(e.hireDate), e.prefix ?? "", e.gender ?? "",
      e.firstNameTh, e.lastNameTh, e.firstNameEn ?? "", e.lastNameEn ?? "",
      e.nicknameTh ?? "", e.nicknameEn ?? "", e.nationalId ?? "", (e.userId ? emailById.get(e.userId) : null) ?? "",
      e.level ?? "", e.position?.name ?? "", "บริษัท โกไฟว์ จำกัด", e.department?.name ?? "",
      STATUS_MAP[e.employmentStatus] ?? e.employmentStatus, e.employmentType ?? "",
      e.manager?.employeeCode ?? "", e.workShift,
      fmtDate(e.dateOfBirth), e.nationality ?? "", e.religion ?? "",
      e.maritalStatus ?? "", e.militaryStatus ?? "", e.bloodType ?? "",
      e.socialSecurityNo ?? "", e.hospitalCode ?? "",
      e.phone ?? "", e.personalEmail ?? "", e.lineId ?? "",
      e.addressRegistered ?? "", e.provinceRegistered ?? "",
      e.addressCurrent ?? "", e.provinceCurrent ?? "",
      e.emergencyName ? `${e.emergencyName} ${e.emergencyLastName ?? ""}`.trim() : "",
      e.emergencyRelation ?? "", e.emergencyPhone ?? "",
    ]);
  }

  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}
