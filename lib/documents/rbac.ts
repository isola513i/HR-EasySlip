import type { Document } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HR_ROLES } from "@/lib/security/rbac";
import type { Caller, DocumentCategory } from "./types";

export const isHr = (caller: Caller): boolean =>
  caller.roles.some((r) => HR_ROLES.includes(r));

export const isOwner = (caller: Caller, ownerEmployeeId: string): boolean =>
  !!caller.employeeId && caller.employeeId === ownerEmployeeId;

export async function isManagerOfOwner(caller: Caller, ownerEmployeeId: string): Promise<boolean> {
  if (!caller.employeeId) return false;
  const owner = await prisma.employee.findUnique({
    where: { id: ownerEmployeeId },
    select: { managerId: true },
  });
  return owner?.managerId === caller.employeeId;
}

/**
 * RBAC matrix per category:
 *  - contract: HR-only writes; owner + HR read
 *  - certificate / general: owner + HR read/write
 *  - leave_attachment / time_correction_proof: owner + HR read/write,
 *    direct manager (of owner) read-only
 */
export async function canRead(
  caller: Caller,
  doc: Pick<Document, "ownerEmployeeId" | "category">,
): Promise<boolean> {
  if (isOwner(caller, doc.ownerEmployeeId)) return true;
  if (isHr(caller)) return true;
  if (doc.category === "leave_attachment" || doc.category === "time_correction_proof") {
    return isManagerOfOwner(caller, doc.ownerEmployeeId);
  }
  return false;
}

export function canWrite(
  caller: Caller,
  ownerEmployeeId: string,
  category: DocumentCategory,
): boolean {
  if (category === "contract") return isHr(caller);
  return isOwner(caller, ownerEmployeeId) || isHr(caller);
}
