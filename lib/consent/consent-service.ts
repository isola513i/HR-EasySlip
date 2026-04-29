import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";

interface RequestMeta {
  ip: string;
  userAgent: string;
}

export const CONSENT_PURPOSE = "PDPA-EmployeeData-v1";
export const CONSENT_VERSION = "1.0";

export async function hasActiveConsent(userId: string): Promise<boolean> {
  const record = await prisma.consentRecord.findFirst({
    where: {
      userId,
      purpose: CONSENT_PURPOSE,
      version: CONSENT_VERSION,
      granted: true,
      withdrawnAt: null,
    },
  });
  return record !== null;
}

export async function getConsentStatus(userId: string) {
  const record = await prisma.consentRecord.findFirst({
    where: {
      userId,
      purpose: CONSENT_PURPOSE,
      version: CONSENT_VERSION,
      granted: true,
      withdrawnAt: null,
    },
    orderBy: { grantedAt: "desc" },
    select: { granted: true, grantedAt: true, purpose: true, version: true },
  });

  return {
    consented: record !== null,
    purpose: CONSENT_PURPOSE,
    version: CONSENT_VERSION,
    grantedAt: record?.grantedAt ?? null,
  };
}

export async function grantConsent(userId: string, meta: RequestMeta) {
  const existing = await prisma.consentRecord.findFirst({
    where: {
      userId,
      purpose: CONSENT_PURPOSE,
      version: CONSENT_VERSION,
      granted: true,
      withdrawnAt: null,
    },
    orderBy: { grantedAt: "desc" },
  });
  if (existing) return existing;

  const record = await prisma.consentRecord.create({
    data: {
      userId,
      purpose: CONSENT_PURPOSE,
      version: CONSENT_VERSION,
      granted: true,
      grantedAt: new Date(),
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  await writeAuditLog({
    actorId: userId,
    action: "consent.grant",
    entityType: "ConsentRecord",
    entityId: record.id,
    after: record,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return record;
}

export async function withdrawConsent(userId: string, meta: RequestMeta) {
  const consent = await prisma.consentRecord.findFirst({
    where: { userId, purpose: CONSENT_PURPOSE, granted: true, withdrawnAt: null },
    orderBy: { grantedAt: "desc" },
  });

  if (!consent) return null;

  const updated = await prisma.consentRecord.update({
    where: { id: consent.id },
    data: { granted: false, withdrawnAt: new Date() },
  });

  await writeAuditLog({
    actorId: userId,
    action: "consent.withdraw",
    entityType: "ConsentRecord",
    entityId: consent.id,
    before: consent,
    after: updated,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
}
