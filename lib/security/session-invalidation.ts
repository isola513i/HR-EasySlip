// ════════════════════════════════════════════════════════════════
// Session Invalidation — Force sign-out on critical user changes
// ────────────────────────────────────────────────────────────────
// Call these when HR disables a user, changes roles, or updates
// employment status to SUSPENDED/RESIGNED/TERMINATED.
// Deleting all sessions forces the user to re-authenticate.
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";

/**
 * Invalidate all sessions for a user. They will be signed out
 * on their next request.
 */
export async function invalidateUserSessions(
  userId: string,
  reason: string,
  actorId: string | null,
): Promise<number> {
  const { count } = await prisma.session.deleteMany({
    where: { userId },
  });

  if (count > 0) {
    await writeAuditLog({
      actorId,
      action: "auth.sessions_invalidated",
      entityType: "User",
      entityId: userId,
      after: { sessionsRemoved: count },
      reason,
    });
  }

  return count;
}

/**
 * Call when a user is disabled by HR/admin.
 */
export async function onUserDisabled(
  userId: string,
  actorId: string,
): Promise<void> {
  await invalidateUserSessions(userId, "User account disabled", actorId);
}

/**
 * Call when employment status changes to a blocked status.
 */
export async function onEmploymentStatusChanged(
  userId: string,
  newStatus: string,
  actorId: string,
): Promise<void> {
  const blockedStatuses = ["SUSPENDED", "RESIGNED", "TERMINATED"];
  if (blockedStatuses.includes(newStatus)) {
    await invalidateUserSessions(
      userId,
      `Employment status changed to ${newStatus}`,
      actorId,
    );
  }
}

/**
 * Call when user roles are changed (e.g. demoted from HRMG).
 * Forces re-authentication so the session picks up new roles.
 */
export async function onRolesChanged(
  userId: string,
  actorId: string,
): Promise<void> {
  await invalidateUserSessions(userId, "User roles modified", actorId);
}
