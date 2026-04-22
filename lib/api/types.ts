// ════════════════════════════════════════════════════════════════
// Shared API Types — used across all service layers
// ════════════════════════════════════════════════════════════════

import type { Role } from "@prisma/client";

export interface Caller {
  userId: string;
  employeeId: string;
  roles: Role[];
}

export interface RequestMeta {
  ip: string;
  userAgent: string;
}
