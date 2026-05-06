// ════════════════════════════════════════════════════════════════
// Seed: PDPA consent records — pre-grant the active consent version
// for every seeded user so dev/E2E sessions don't redirect to the
// consent page on first login. Purpose + version mirror the runtime
// values in lib/consent/consent-service.ts.
// ════════════════════════════════════════════════════════════════

import type { PrismaClient } from "@prisma/client";
import type { EmployeeRecord } from "./employees";

const PURPOSE = "PDPA-EmployeeData-v1";
const VERSION = "1.0.0";

export async function seedPdpaConsents(
  prisma: PrismaClient,
  employeeMap: Map<string, EmployeeRecord>,
): Promise<number> {
  let granted = 0;

  for (const emp of employeeMap.values()) {
    const existing = await prisma.consentRecord.findFirst({
      where: { userId: emp.userId, purpose: PURPOSE, version: VERSION },
    });
    if (existing) continue;

    await prisma.consentRecord.create({
      data: {
        userId: emp.userId,
        purpose: PURPOSE,
        version: VERSION,
        granted: true,
        grantedAt: new Date("2026-01-01"),
        ipAddress: null,
        userAgent: "seed",
      },
    });
    granted += 1;
  }

  return granted;
}
