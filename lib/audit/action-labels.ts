// ════════════════════════════════════════════════════════════════
// Audit Action Labels — shared Thai / English label maps
// ════════════════════════════════════════════════════════════════

export const ACTION_LABELS_TH: Record<string, string> = {
  "leave.submit": "ส่งคำขอลา",
  "leave.approve": "คำขอลาอนุมัติแล้ว",
  "leave.reject": "คำขอลาถูกปฏิเสธ",
  "leave.withdraw": "ถอนคำขอลา",
  "attendance.clock_in": "ลงเวลาเข้างาน",
  "attendance.clock_in.out_of_geofence": "ลงเวลาเข้างาน (นอกพื้นที่)",
  "attendance.clock_out": "ลงเวลาออกงาน",
  "attendance.clock_out.out_of_geofence": "ลงเวลาออกงาน (นอกพื้นที่)",
  "overtime.submit": "ส่งคำขอ OT",
  "consent.grant": "ยินยอม PDPA",
  "consent.withdraw": "ถอนความยินยอม PDPA",
  "employee.profile_updated": "แก้ไขข้อมูลส่วนตัว",
  "employee.create": "สร้างพนักงานใหม่",
  "auth.signin": "เข้าสู่ระบบ",
  "auth.signout": "ออกจากระบบ",
  "auth.blocked": "ถูกบล็อค",
  "employee.notification_prefs_updated": "แก้ไขการแจ้งเตือน",
  "settings.update": "แก้ไขการตั้งค่า",
  "export.employee_data": "ส่งออกข้อมูลพนักงาน",
  "export.payroll_info": "ส่งออกข้อมูลเงินเดือน",
  "user.change_password": "เปลี่ยนรหัสผ่าน",
  "user.reset_password": "รีเซ็ตรหัสผ่านโดย HR",
  "user.reset_password_self": "รีเซ็ตรหัสผ่านด้วยตนเอง",
};

export const ACTION_LABELS_EN: Record<string, string> = {
  "leave.submit": "Leave request submitted",
  "leave.approve": "Leave approved",
  "leave.reject": "Leave rejected",
  "leave.withdraw": "Leave withdrawn",
  "attendance.clock_in": "Clocked in",
  "attendance.clock_in.out_of_geofence": "Clocked in (outside office)",
  "attendance.clock_out": "Clocked out",
  "attendance.clock_out.out_of_geofence": "Clocked out (outside office)",
  "overtime.submit": "OT request submitted",
  "consent.grant": "Consent granted",
  "consent.withdraw": "Consent withdrawn",
  "employee.profile_updated": "Profile updated",
  "employee.create": "Employee created",
  "auth.signin": "Signed in",
  "auth.signout": "Signed out",
  "auth.blocked": "Blocked",
  "employee.notification_prefs_updated": "Notification preferences updated",
  "settings.update": "Settings updated",
  "export.employee_data": "Employee data exported",
  "export.payroll_info": "Payroll info exported",
  "user.change_password": "Password changed",
  "user.reset_password": "Password reset by HR",
  "user.reset_password_self": "Password reset",
};

export function getActionLabel(action: string, locale: "th" | "en" = "th"): string {
  const map = locale === "th" ? ACTION_LABELS_TH : ACTION_LABELS_EN;
  return map[action] ?? action.replace(/[._]/g, " ");
}
