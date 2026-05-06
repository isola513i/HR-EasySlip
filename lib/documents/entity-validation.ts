import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/api/errors";
import type { DocumentCategory, DocumentEntityType } from "./types";

/** Resolve the owning employee for any supported entity. */
export async function resolveEntityOwner(
  entityType: DocumentEntityType,
  entityId: string,
): Promise<string> {
  if (entityType === "Employee") return entityId;
  if (entityType === "LeaveRequest") {
    const lr = await prisma.leaveRequest.findUnique({
      where: { id: entityId },
      select: { employeeId: true },
    });
    if (!lr) throw new DomainError("ENTITY_NOT_FOUND", { entityType }, 404);
    return lr.employeeId;
  }
  const tr = await prisma.timeAdjustmentRequest.findUnique({
    where: { id: entityId },
    select: { employeeId: true },
  });
  if (!tr) throw new DomainError("ENTITY_NOT_FOUND", { entityType }, 404);
  return tr.employeeId;
}

// Each category attaches to exactly one entity type. Mismatched pairs
// (e.g. category=contract on entityType=LeaveRequest) are rejected.
const CATEGORY_ENTITY: Record<DocumentCategory, DocumentEntityType> = {
  contract: "Employee",
  certificate: "Employee",
  general: "Employee",
  leave_attachment: "LeaveRequest",
  time_correction_proof: "TimeAdjustmentRequest",
};

/**
 * Verify that (entityType, entityId) actually belongs to ownerEmployeeId
 * AND matches the category's expected entity type. Without this, a regular
 * employee could attach a `leave_attachment` to another employee's
 * LeaveRequest — the only RBAC the upload would see is "owner == caller",
 * which would pass on the spoofed ownerEmployeeId.
 */
export async function assertEntityBelongsToOwner(
  category: DocumentCategory,
  entityType: DocumentEntityType,
  entityId: string,
  ownerEmployeeId: string,
): Promise<void> {
  if (CATEGORY_ENTITY[category] !== entityType) {
    throw new DomainError("INVALID_CATEGORY_ENTITY", { category, entityType }, 400);
  }
  if (entityType === "Employee") {
    if (entityId !== ownerEmployeeId) {
      throw new DomainError("ENTITY_OWNER_MISMATCH", {}, 403);
    }
    return;
  }
  if (entityType === "LeaveRequest") {
    const lr = await prisma.leaveRequest.findUnique({
      where: { id: entityId },
      select: { employeeId: true },
    });
    if (!lr) throw new DomainError("ENTITY_NOT_FOUND", { entityType }, 404);
    if (lr.employeeId !== ownerEmployeeId) {
      throw new DomainError("ENTITY_OWNER_MISMATCH", {}, 403);
    }
    return;
  }
  if (entityType === "TimeAdjustmentRequest") {
    const tr = await prisma.timeAdjustmentRequest.findUnique({
      where: { id: entityId },
      select: { employeeId: true },
    });
    if (!tr) throw new DomainError("ENTITY_NOT_FOUND", { entityType }, 404);
    if (tr.employeeId !== ownerEmployeeId) {
      throw new DomainError("ENTITY_OWNER_MISMATCH", {}, 403);
    }
  }
}
