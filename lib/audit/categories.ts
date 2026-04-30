// ════════════════════════════════════════════════════════════════
// Audit Categories — action classification + module mapping
// Pure functions, safe for both server and client.
// ════════════════════════════════════════════════════════════════

export type AuditCategory = "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "OTHER";

export type AuditModule =
  | "EMPLOYEES"
  | "LEAVE"
  | "ATTENDANCE"
  | "OVERTIME"
  | "PAYROLL"
  | "REPORTS"
  | "SETTINGS"
  | "OTHER";

export const AUDIT_MODULES: AuditModule[] = [
  "EMPLOYEES",
  "LEAVE",
  "ATTENDANCE",
  "OVERTIME",
  "PAYROLL",
  "REPORTS",
  "SETTINGS",
];

const ENTITY_TO_MODULE: Record<string, AuditModule> = {
  Employee: "EMPLOYEES",
  LeaveQuota: "EMPLOYEES",
  LeaveRequest: "LEAVE",
  AttendanceRecord: "ATTENDANCE",
  TimeAdjustmentRequest: "ATTENDANCE",
  OvertimeRequest: "OVERTIME",
  PayrollCycle: "PAYROLL",
  PayrollOutboxEvent: "PAYROLL",
  Report: "REPORTS",
  User: "SETTINGS",
  SystemConfig: "SETTINGS",
  ConsentRecord: "SETTINGS",
};

export function moduleForEntity(entityType: string): AuditModule {
  return ENTITY_TO_MODULE[entityType] ?? "OTHER";
}

/** Categorize an action code (e.g. "leave.approve") into one of 5 buckets. */
export function categorizeAction(action: string): AuditCategory {
  const lower = action.toLowerCase();
  if (lower.startsWith("export.") || lower.includes(".export")) return "EXPORT";
  if (
    lower.endsWith(".create") ||
    lower.endsWith(".submit") ||
    lower.endsWith(".grant") ||
    lower.endsWith(".add")
  ) {
    return "CREATE";
  }
  if (
    lower.endsWith(".delete") ||
    lower.endsWith(".remove") ||
    lower.endsWith(".withdraw") ||
    lower.endsWith(".anonymize")
  ) {
    return "DELETE";
  }
  if (
    lower.endsWith(".update") ||
    lower.endsWith(".lock") ||
    lower.endsWith(".unlock") ||
    lower.includes(".approve") ||
    lower.includes(".reject") ||
    lower.includes(".clock_") ||
    lower.includes("_updated")
  ) {
    return "UPDATE";
  }
  return "OTHER";
}
