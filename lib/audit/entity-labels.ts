// Friendly TH/EN names for entity types in the inbox / activity feed.

export const ENTITY_LABELS_TH: Record<string, string> = {
  LeaveRequest: "คำขอลา",
  OvertimeRequest: "คำขอ OT",
  AttendanceRecord: "การลงเวลา",
  Employee: "ข้อมูลพนักงาน",
  User: "บัญชีผู้ใช้",
  ConsentRecord: "ความยินยอม",
  NotificationPref: "การแจ้งเตือน",
  PayrollCycle: "รอบเงินเดือน",
  Department: "แผนก",
  Position: "ตำแหน่ง",
};

export const ENTITY_LABELS_EN: Record<string, string> = {
  LeaveRequest: "Leave request",
  OvertimeRequest: "OT request",
  AttendanceRecord: "Attendance",
  Employee: "Employee record",
  User: "User account",
  ConsentRecord: "Consent",
  NotificationPref: "Notification settings",
  PayrollCycle: "Payroll cycle",
  Department: "Department",
  Position: "Position",
};

export function getEntityLabel(entityType: string, locale: "th" | "en" = "th"): string {
  const map = locale === "th" ? ENTITY_LABELS_TH : ENTITY_LABELS_EN;
  return map[entityType] ?? entityType;
}
