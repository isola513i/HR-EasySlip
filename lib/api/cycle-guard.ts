// ════════════════════════════════════════════════════════════════
// Cycle Guard — assert payroll cycle is OPEN before mutations
// ════════════════════════════════════════════════════════════════

import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CUTOFF_OVERRIDE_ROLES } from "@/lib/security/rbac";
import { DomainError, ErrorCodes } from "./errors";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Check that the payroll cycle containing `date` is OPEN.
 * Throws CYCLE_LOCKED if locked/exported — unless caller has override roles.
 */
export async function assertCycleOpen(
  date: Date,
  callerRoles: Role[],
  tx?: TxClient,
): Promise<void> {
  const hasOverride = callerRoles.some((r) =>
    (CUTOFF_OVERRIDE_ROLES as readonly string[]).includes(r),
  );
  if (hasOverride) return;

  const client = tx ?? prisma;
  const cycle = await client.payrollCycle.findFirst({
    where: {
      cycleStart: { lte: date },
      cycleEnd: { gte: date },
    },
    select: { id: true, status: true },
  });

  if (!cycle) {
    throw new DomainError("NO_CYCLE", {
      message: "No payroll cycle covers this date",
      date: date.toISOString(),
    });
  }

  if (cycle.status !== "OPEN") {
    throw new DomainError(ErrorCodes.CYCLE_LOCKED, {
      cycleId: cycle.id,
      status: cycle.status,
    });
  }
}
