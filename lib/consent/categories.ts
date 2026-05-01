// ════════════════════════════════════════════════════════════════
// PDPA Consent Categories — logical groupings shown in HR dashboard
// ════════════════════════════════════════════════════════════════

export const CONSENT_CATEGORIES = [
  "PERSONAL",
  "EMPLOYMENT",
  "FINANCIAL",
  "HEALTH",
  "MARKETING",
] as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export const REQUIRED_CATEGORIES: readonly ConsentCategory[] = [
  "PERSONAL",
  "EMPLOYMENT",
  "FINANCIAL",
];

export function isRequiredCategory(c: ConsentCategory): boolean {
  return REQUIRED_CATEGORIES.includes(c);
}

export type ConsentStatus = "CONSENTED" | "PENDING" | "WITHDRAWN" | "PARTIAL";

export function gradeFromRate(rate: number): "A+" | "A" | "B" | "C" | "D" {
  if (rate >= 95) return "A+";
  if (rate >= 90) return "A";
  if (rate >= 80) return "B";
  if (rate >= 70) return "C";
  return "D";
}
