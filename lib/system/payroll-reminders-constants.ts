import type { Role } from "@prisma/client";

/**
 * Roles that receive cut-off cron reminders (in-app + email). Mirrors
 * HR_ROLES from rbac.ts but exported as a `Role[]` so it can be used
 * inline in Prisma `hasSome` filters without circular imports through
 * the rbac module.
 */
export const HR_ROLES_FOR_REMINDERS: readonly Role[] = [
  "HRMG",
  "HR_AUTHORIZED",
  "CEO",
  "CTO",
  "COO",
] as const;
