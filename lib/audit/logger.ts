// ════════════════════════════════════════════════════════════════
// Audit Logger — Immutable audit trail for PDPA compliance
// ────────────────────────────────────────────────────────────────
// Every mutation to sensitive data MUST call this service.
// Logs are append-only (no UPDATE/DELETE on AuditLog table).
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

interface AuditLogInput {
  /** userId of actor, null for system/cron actions */
  actorId: string | null;
  /** Action identifier, e.g. "auth.signin", "leave.approve" */
  action: string;
  /** Entity type, e.g. "User", "LeaveRequest" */
  entityType: string;
  /** Entity ID being acted upon */
  entityId: string;
  /** State before mutation (null for creates) */
  before?: unknown;
  /** State after mutation (null for deletes) */
  after?: unknown;
  /** Client IP address */
  ipAddress?: string | null;
  /** Client user agent */
  userAgent?: string | null;
  /** Human-readable reason (required for sensitive actions) */
  reason?: string | null;
}

/**
 * Write an immutable audit log entry.
 * Can be used standalone or within a Prisma transaction.
 */
export async function writeAuditLog(
  input: AuditLogInput,
  tx?: TxClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before as Prisma.InputJsonValue ?? undefined,
      after: input.after as Prisma.InputJsonValue ?? undefined,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      reason: input.reason ?? null,
    },
  });
}

/**
 * Convenience: log an auth event (signin, signout, blocked).
 */
export async function logAuthEvent(
  action: "auth.signin" | "auth.signout" | "auth.blocked" | "auth.magic_link_sent",
  userId: string,
  meta?: { ipAddress?: string; userAgent?: string; reason?: string },
): Promise<void> {
  await writeAuditLog({
    actorId: userId,
    action,
    entityType: "User",
    entityId: userId,
    reason: meta?.reason,
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });
}
