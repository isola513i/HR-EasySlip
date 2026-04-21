// ════════════════════════════════════════════════════════════════
// Seed: Leave Quotas for 2026
// ────────────────────────────────────────────────────────────────
// Rules (Thai Labor Law 2025 — locked in):
//   SICK      = 30 days from Day 1 (all non-terminated)
//   PERSONAL  = 3 days from Day 1 (all non-terminated)
//   ANNUAL    = 6 days ONLY if past 1-year anniversary;
//               prorated if anniversary falls mid-year
//
// Uses computeAnnualLeaveGrant for ANNUAL logic — DRY with the
// production cron engine at lib/leave/annual-quota-engine.ts
// ════════════════════════════════════════════════════════════════

import { Prisma, PrismaClient } from '@prisma/client';
import { computeAnnualLeaveGrant } from '../../lib/leave/annual-quota-engine';
import type { EmployeeRecord } from './employees';

const QUOTA_YEAR = 2026;
const EVAL_DATE = new Date('2026-04-22'); // "today" for seed

const SICK_DAYS = new Prisma.Decimal(30);
const PERSONAL_DAYS = new Prisma.Decimal(3);

export async function seedLeaveQuotas(
  prisma: PrismaClient,
  employees: Map<string, EmployeeRecord>,
): Promise<void> {
  for (const emp of employees.values()) {
    // Skip terminated / resigned
    if (
      emp.employmentStatus === 'TERMINATED' ||
      emp.employmentStatus === 'RESIGNED'
    ) {
      continue;
    }

    // ─── SICK: 30 days from Day 1 ───
    await upsertQuota(prisma, {
      employeeId: emp.id,
      leaveType: 'SICK',
      quotaYear: QUOTA_YEAR,
      eligibleFrom: new Date(`${QUOTA_YEAR}-01-01`),
      allocatedDays: SICK_DAYS,
      isProrated: false,
      prorateBasis: null,
    });

    // ─── PERSONAL: 3 days from Day 1 ───
    await upsertQuota(prisma, {
      employeeId: emp.id,
      leaveType: 'PERSONAL',
      quotaYear: QUOTA_YEAR,
      eligibleFrom: new Date(`${QUOTA_YEAR}-01-01`),
      allocatedDays: PERSONAL_DAYS,
      isProrated: false,
      prorateBasis: null,
    });

    // ─── ANNUAL: use production engine ───
    const grant = computeAnnualLeaveGrant(emp.hireDate, EVAL_DATE, null);
    if (grant.action === 'NONE') continue;

    await upsertQuota(prisma, {
      employeeId: emp.id,
      leaveType: 'ANNUAL',
      quotaYear: QUOTA_YEAR,
      eligibleFrom: grant.eligibleFrom,
      allocatedDays: grant.days,
      isProrated: grant.action === 'GRANT_PRORATED',
      prorateBasis:
        grant.action === 'GRANT_PRORATED' ? grant.basis : null,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// Helper: upsert by composite unique key (employeeId, leaveType, quotaYear)
// ────────────────────────────────────────────────────────────────

type QuotaInput = {
  employeeId: string;
  leaveType: 'SICK' | 'PERSONAL' | 'ANNUAL';
  quotaYear: number;
  eligibleFrom: Date;
  allocatedDays: Prisma.Decimal;
  isProrated: boolean;
  prorateBasis: string | null;
};

async function upsertQuota(
  prisma: PrismaClient,
  input: QuotaInput,
): Promise<void> {
  await prisma.leaveQuota.upsert({
    where: {
      employeeId_leaveType_quotaYear: {
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        quotaYear: input.quotaYear,
      },
    },
    create: {
      employeeId: input.employeeId,
      leaveType: input.leaveType,
      quotaYear: input.quotaYear,
      eligibleFrom: input.eligibleFrom,
      allocatedDays: input.allocatedDays,
      isProrated: input.isProrated,
      prorateBasis: input.prorateBasis,
    },
    update: {
      allocatedDays: input.allocatedDays,
      isProrated: input.isProrated,
      prorateBasis: input.prorateBasis,
    },
  });
}
