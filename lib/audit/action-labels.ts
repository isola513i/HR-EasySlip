// ════════════════════════════════════════════════════════════════
// Audit Action Labels — shared Thai / English label maps
// ════════════════════════════════════════════════════════════════

export const ACTION_LABELS_TH: Record<string, string> = {
  "leave.submit": "ส่งคำขอลา",
  "leave.approve": "คำขอลาอนุมัติแล้ว",
  "leave.reject": "คำขอลาถูกปฏิเสธ",
  "leave.withdraw": "ถอนคำขอลา",
  "attendance.clock_in": "ลงเวลาเข้างาน",
  "attendance.clock_out": "ลงเวลาออกงาน",
  "overtime.submit": "ส่งคำขอ OT",
  "consent.grant": "ยินยอม PDPA",
  "employee.profile_updated": "แก้ไขข้อมูลส่วนตัว",
  "employee.create": "สร้างพนักงานใหม่",
};

export const ACTION_LABELS_EN: Record<string, string> = {
  "leave.submit": "Leave request submitted",
  "leave.approve": "Leave approved",
  "leave.reject": "Leave rejected",
  "leave.withdraw": "Leave withdrawn",
  "attendance.clock_in": "Clocked in",
  "attendance.clock_out": "Clocked out",
  "overtime.submit": "OT request submitted",
  "consent.grant": "Consent granted",
  "employee.profile_updated": "Profile updated",
  "employee.create": "Employee created",
};

export function getActionLabel(action: string, locale: "th" | "en" = "th"): string {
  const map = locale === "th" ? ACTION_LABELS_TH : ACTION_LABELS_EN;
  return map[action] ?? action.replace(/[._]/g, " ");
}
