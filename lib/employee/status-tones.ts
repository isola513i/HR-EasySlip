export const EMPLOYMENT_STATUSES = [
  "ACTIVE",
  "PROBATION",
  "SUSPENDED",
  "RESIGNED",
  "TERMINATED",
  "RETIRED",
  "CONTRACT_ENDED",
] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const EMPLOYMENT_STATUS_TONE: Record<EmploymentStatus, "success" | "warn" | "error" | "neutral"> = {
  ACTIVE: "success",
  PROBATION: "warn",
  SUSPENDED: "error",
  RESIGNED: "neutral",
  TERMINATED: "neutral",
  RETIRED: "neutral",
  CONTRACT_ENDED: "neutral",
};

export function statusTone(status: string): "success" | "warn" | "error" | "neutral" {
  return EMPLOYMENT_STATUS_TONE[status as EmploymentStatus] ?? "neutral";
}
