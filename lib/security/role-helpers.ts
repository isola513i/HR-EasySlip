import type { Role } from "@prisma/client";

/**
 * Roles authorized to view org-wide sensitive personnel data per CLAUDE.md §3.
 * ADMIN is intentionally excluded — system-admin role does not imply data clearance.
 */
export const SENSITIVE_DATA_ROLES: readonly Role[] = [
  "HRMG",
  "HR_AUTHORIZED",
  "CEO",
  "CTO",
  "COO",
] as const;

export function isSensitiveDataRole(roles: readonly Role[]): boolean {
  return roles.some((r) => SENSITIVE_DATA_ROLES.includes(r));
}
