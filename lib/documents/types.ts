import type { Role } from "@prisma/client";

export const DOCUMENT_CATEGORIES = [
  "contract",
  "certificate",
  "general",
  "leave_attachment",
  "time_correction_proof",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_ENTITY_TYPES = ["Employee", "LeaveRequest", "TimeAdjustmentRequest"] as const;
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export interface Caller {
  userId: string;
  employeeId: string | null | undefined;
  roles: readonly Role[];
}
