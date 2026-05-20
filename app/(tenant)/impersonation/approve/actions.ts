"use server";

import { requireRoles, TENANT_ADMIN_ROLES } from "@/lib/security/rbac";
import { getTenantId } from "@/lib/db/tenant-context";
import { getTenantPrisma } from "@/lib/db/tenant";
import { getControlPlane } from "@/lib/db/control-plane";

type ActionResult = { success: true; action: "approve" | "reject" } | { error: string };

export async function decideImpersonationRequest(
  requestId: string,
  action: "approve" | "reject",
  note?: string,
): Promise<ActionResult> {
  const caller = await requireRoles(TENANT_ADMIN_ROLES);
  const tenantId = await getTenantId();
  const cp = getControlPlane();

  const request = await cp.impersonationRequest.findUnique({
    where: { id: requestId },
    select: { id: true, tenantId: true, status: true, expiresAt: true },
  });

  if (!request) return { error: "Request not found." };
  if (request.tenantId !== tenantId) return { error: "Forbidden." };
  if (request.status !== "PENDING") return { error: `Request is already ${request.status}.` };
  if (request.expiresAt < new Date()) return { error: "Request has expired." };

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  await cp.impersonationRequest.update({
    where: { id: requestId },
    data: {
      status: newStatus,
      decidedAt: new Date(),
      decidedByUserId: caller.userId,
      decidedByEmail: caller.email ?? null,
      decisionNote: note ?? null,
    },
  });

  // Tenant-side audit log
  const prisma = await getTenantPrisma(tenantId);
  await prisma.auditLog.create({
    data: {
      actorId: caller.userId,
      action: action === "approve" ? "impersonation.approve" : "impersonation.reject",
      entityType: "ImpersonationRequest",
      entityId: requestId,
      after: { status: newStatus, note: note ?? null },
    },
  });

  return { success: true, action };
}
