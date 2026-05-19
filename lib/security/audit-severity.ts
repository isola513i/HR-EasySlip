export type AuditSeverity = "info" | "warn" | "critical";

const CRITICAL = [
  "impersonation.start",
  "impersonation.end",
  "tenant.suspend",
  "tenant.delete",
  "platform_user.delete",
];

const WARN = [
  "tenant.plan_change",
  "tenant.provision",
  "trial.approve",
  "tenant.status_change",
  "tenant.create_manual",
  "platform_user.create",
  "platform_user.toggle",
];

export function getSeverity(action: string): AuditSeverity {
  if (CRITICAL.some((p) => action === p || action.startsWith(p + "."))) return "critical";
  if (WARN.some((p) => action === p || action.startsWith(p + "."))) return "warn";
  return "info";
}
