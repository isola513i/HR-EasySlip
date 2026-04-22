// ════════════════════════════════════════════════════════════════
// Consent Service — PDPA consent management
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import type { ConsentGrantInput } from "./schemas";

interface RequestMeta {
  ip: string;
  userAgent: string;
}

export async function grantConsent(
  userId: string,
  input: ConsentGrantInput,
  meta: RequestMeta,
) {
  const record = await prisma.consentRecord.create({
    data: {
      userId,
      purpose: input.purpose,
      version: input.version,
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

export async function withdrawConsent(
  userId: string,
  meta: RequestMeta,
) {
  // Find latest active consent
  const consent = await prisma.consentRecord.findFirst({
    where: { userId, granted: true, withdrawnAt: null },
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
