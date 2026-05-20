import { Prisma } from "@prisma/client";
import { getTenantPrisma } from "@/lib/db/tenant";
import { logger } from "@/lib/observability/logger";

type PlatformAuditAction =
  | "platform_support.session_start"
  | "platform_support.session_end"
  | "platform_support.view"
  | "platform_support.access_denied";

interface WritePlatformAuditInput {
  tenantId: string;
  impersonationId: string;
  platformActorId: string;
  platformActorEmail: string;
  action: PlatformAuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Write a platform-support audit log entry to the tenant's own AuditLog.
 * These entries are visible to tenant admins in their audit log UI.
 * Best-effort — failures are logged but not thrown.
 */
export async function writePlatformAuditToTenant(input: WritePlatformAuditInput): Promise<void> {
  try {
    const prisma = await getTenantPrisma(input.tenantId);
    await prisma.auditLog.create({
      data: {
        actorId: null, // no tenant user actor — cross-silo
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        actorType: "PLATFORM_SUPPORT",
        platformActorId: input.platformActorId,
        platformActorEmail: input.platformActorEmail,
        impersonationId: input.impersonationId,
        after: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    logger.error("writePlatformAuditToTenant failed", { ...input, err: String(err) });
  }
}
