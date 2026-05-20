"use server";

import { getControlPlane } from "@/lib/db/control-plane";
import { requirePlatformSession } from "@/lib/auth/platform";
import { PLATFORM_ADMIN_ROLES } from "@/lib/security/platform-rbac";
import { createImpersonationToken } from "@/lib/auth/impersonation";
import {
  createApprovalToken,
  hashApprovalToken,
  approvalExpiresAt,
  REQUIRE_APPROVAL,
} from "@/lib/auth/impersonation-request";
import { notifyImpersonationRequest } from "@/lib/email/impersonation-request-sender";
import { writePlatformAuditToTenant } from "@/lib/audit/platform-audit";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";
const IS_LOCAL = ROOT_DOMAIN.startsWith("localhost") || ROOT_DOMAIN.includes("lvh.me");

function tenantBase(slug: string): string {
  return IS_LOCAL ? `http://${slug}.lvh.me:3000` : `https://${slug}.${ROOT_DOMAIN}`;
}

// ─── Request Access (consent flow) ────────────────────────────────────────────

type RequestResult =
  | { error: string }
  | { requestId: string; status: "PENDING" }
  | { redirectUrl: string }; // when REQUIRE_APPROVAL=false (dev only)

export async function requestImpersonation(
  tenantId: string,
  _prev: RequestResult | null,
  formData: FormData,
): Promise<RequestResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);

  const reason = (formData.get("reason") as string | null)?.trim();
  if (!reason) return { error: "Reason is required." };

  const cp = getControlPlane();

  const tenant = await cp.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, status: true, impersonationEnabled: true },
  });
  if (!tenant) return { error: "Tenant not found." };
  if (tenant.status === "SUSPENDED" || tenant.status === "DELETED") {
    return { error: "Cannot impersonate a suspended or deleted tenant." };
  }
  if (!tenant.impersonationEnabled) {
    return { error: "This tenant has disabled platform support access." };
  }

  // Dev bypass: skip consent and launch directly
  if (!REQUIRE_APPROVAL) {
    return _launchDirectly(session, tenant, reason, cp);
  }

  const expiresAt = approvalExpiresAt();
  const approvalToken = await createApprovalToken({ requestId: "PENDING", tenantId });
  // We need to create the record first to get requestId, then re-sign with requestId.
  // Use a two-step: create with placeholder hash, then update after we have the real token.
  const request = await cp.impersonationRequest.create({
    data: {
      platformUserId: session.userId,
      tenantId,
      reason,
      expiresAt,
      approvalTokenHash: "PENDING",
    },
  });

  const realToken = await createApprovalToken({ requestId: request.id, tenantId });
  const hash = hashApprovalToken(realToken);

  await cp.impersonationRequest.update({
    where: { id: request.id },
    data: { approvalTokenHash: hash },
  });

  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId,
      action: "impersonation.request",
      targetType: "ImpersonationRequest",
      targetId: request.id,
      metadata: { reason, tenantSlug: tenant.slug },
    },
  });

  // Fire-and-forget: send emails to tenant admins
  notifyImpersonationRequest(request.id).catch((err) =>
    console.error("[impersonation] notify failed:", err),
  );

  return { requestId: request.id, status: "PENDING" };
}

async function _launchDirectly(
  session: { userId: string; email: string },
  tenant: { id: string; slug: string },
  reason: string,
  cp: ReturnType<typeof getControlPlane>,
): Promise<{ redirectUrl: string }> {
  const impersonation = await cp.impersonation.create({
    data: { platformUserId: session.userId, tenantId: tenant.id, reason },
  });
  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId: tenant.id,
      action: "impersonation.start",
      targetType: "Impersonation",
      targetId: impersonation.id,
      metadata: { reason, tenantSlug: tenant.slug, directLaunch: true },
    },
  });
  const expiresAt = Date.now() + 60 * 60 * 1_000;
  const token = await createImpersonationToken({
    impersonationId: impersonation.id,
    platformUserId: session.userId,
    platformEmail: session.email,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    expiresAt,
  });
  return { redirectUrl: `${tenantBase(tenant.slug)}/impersonation/handoff?token=${token}` };
}

// ─── Launch Session (after tenant approval) ────────────────────────────────────

type LaunchResult = { error: string } | { redirectUrl: string };

export async function launchImpersonation(requestId: string): Promise<LaunchResult> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const cp = getControlPlane();

  const request = await cp.impersonationRequest.findUnique({
    where: { id: requestId },
    include: { tenant: { select: { id: true, slug: true, impersonationEnabled: true } } },
  });

  if (!request) return { error: "Request not found." };
  if (request.platformUserId !== session.userId) return { error: "Forbidden." };
  if (request.status !== "APPROVED") return { error: `Request is ${request.status}.` };
  if (request.consumedAt) return { error: "Request already consumed." };
  if (request.expiresAt < new Date()) return { error: "Request has expired." };
  if (!request.tenant.impersonationEnabled) {
    return { error: "Tenant has disabled platform support access." };
  }

  const impersonation = await cp.impersonation.create({
    data: { platformUserId: session.userId, tenantId: request.tenantId, reason: request.reason },
  });

  await cp.impersonationRequest.update({
    where: { id: requestId },
    data: { consumedAt: new Date(), impersonationId: impersonation.id, status: "CONSUMED" },
  });

  await cp.platformAuditLog.create({
    data: {
      actorId: session.userId,
      tenantId: request.tenantId,
      action: "impersonation.start",
      targetType: "Impersonation",
      targetId: impersonation.id,
      metadata: { reason: request.reason, tenantSlug: request.tenant.slug, requestId },
    },
  });

  // Tenant-side audit: visible to tenant admins
  writePlatformAuditToTenant({
    tenantId: request.tenantId,
    impersonationId: impersonation.id,
    platformActorId: session.userId,
    platformActorEmail: session.email,
    action: "platform_support.session_start",
    entityType: "Impersonation",
    entityId: impersonation.id,
    metadata: { reason: request.reason },
  }).catch(() => {}); // best-effort

  const expiresAt = Date.now() + 60 * 60 * 1_000;
  const token = await createImpersonationToken({
    impersonationId: impersonation.id,
    platformUserId: session.userId,
    platformEmail: session.email,
    tenantId: request.tenantId,
    tenantSlug: request.tenant.slug,
    expiresAt,
  });

  return { redirectUrl: `${tenantBase(request.tenant.slug)}/impersonation/handoff?token=${token}` };
}

// ─── Cancel Request ─────────────────────────────────────────────────────────

export async function cancelImpersonationRequest(requestId: string): Promise<{ error: string } | { success: true }> {
  const session = await requirePlatformSession(PLATFORM_ADMIN_ROLES);
  const cp = getControlPlane();

  const request = await cp.impersonationRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Request not found." };
  if (request.platformUserId !== session.userId) return { error: "Forbidden." };
  if (!["PENDING", "APPROVED"].includes(request.status)) {
    return { error: `Cannot cancel a ${request.status} request.` };
  }

  await cp.impersonationRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED", decidedAt: new Date() },
  });

  return { success: true };
}

// Legacy export: kept for backwards compatibility during transition
export { requestImpersonation as startImpersonation };
