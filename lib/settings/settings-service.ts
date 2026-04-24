import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { DomainError, ErrorCodes } from "@/lib/api/errors";
import type { SettingUpdateInput } from "./schemas";

export async function listSettings() {
  return prisma.systemConfig.findMany({
    orderBy: { key: "asc" },
  });
}

export async function updateSetting(
  input: SettingUpdateInput,
  userId: string,
  meta?: { ipAddress?: string; userAgent?: string },
) {
  const existing = await prisma.systemConfig.findUnique({
    where: { key: input.key },
  });
  if (!existing) {
    throw new DomainError(ErrorCodes.RECORD_NOT_FOUND, {}, 404);
  }

  const updated = await prisma.systemConfig.update({
    where: { key: input.key },
    data: { value: input.value, updatedBy: userId },
  });

  await writeAuditLog({
    actorId: userId,
    action: "settings.update",
    entityType: "SystemConfig",
    entityId: input.key,
    before: existing,
    after: updated,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return updated;
}
