import { getControlPlane } from "@/lib/db/control-plane";
import { getTenantPrisma } from "@/lib/db/tenant";
import { logger } from "@/lib/observability/logger";

const DAY_MS = 24 * 60 * 60 * 1_000;
export const GRACE_DAYS = 30;
export const SOFT_DELETE_DAYS = 90;
export const HARD_DELETE_DAYS = 180;

export function buildLifecycleDates(from: Date) {
  return {
    expiredAt: from,
    gracePeriodEndsAt: new Date(from.getTime() + GRACE_DAYS * DAY_MS),
    softDeleteAt: new Date(from.getTime() + SOFT_DELETE_DAYS * DAY_MS),
    hardDeleteAt: new Date(from.getTime() + HARD_DELETE_DAYS * DAY_MS),
  };
}

export function clearLifecycleDates() {
  return {
    expiredAt: null,
    gracePeriodEndsAt: null,
    softDeleteAt: null,
    hardDeleteAt: null,
    softDeletedAt: null,
  };
}

/** Bulk-anonymise all non-anonymised employees in a tenant DB. */
async function anonymiseAllEmployees(tenantId: string): Promise<number> {
  const db = await getTenantPrisma(tenantId);
  const now = new Date();

  const employees = await db.employee.findMany({
    where: { isAnonymized: false },
    select: { id: true, userId: true },
  });

  for (const emp of employees) {
    await db.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: emp.id },
        data: {
          firstNameTh: "[deleted]", lastNameTh: "[deleted]",
          firstNameEn: null, lastNameEn: null, nicknameTh: null, nicknameEn: null,
          prefix: null, gender: null, nationalId: null, phone: null,
          personalEmail: null, lineId: null, dateOfBirth: null,
          nationality: null, ethnicity: null, religion: null,
          maritalStatus: null, militaryStatus: null, bloodType: null,
          socialSecurityNo: null, hospitalCode: null,
          profilePicturePath: null, profilePictureMime: null, profilePictureUploadedAt: null,
          addressRegistered: null, provinceRegistered: null, districtRegistered: null,
          subdistrictRegistered: null, zipCodeRegistered: null,
          addressCurrent: null, provinceCurrent: null, districtCurrent: null,
          subdistrictCurrent: null, zipCodeCurrent: null,
          emergencyName: null, emergencyLastName: null, emergencyRelation: null, emergencyPhone: null,
          isAnonymized: true, anonymizedAt: now,
        },
      });
      // Delete user account so login is no longer possible
      if (emp.userId) {
        await tx.user.deleteMany({ where: { id: emp.userId } });
      }
    });
  }

  return employees.length;
}

export interface LifecycleTickResult {
  suspended: number;
  softDeleted: number;
  hardDeleted: number;
}

/**
 * Daily cron: advance EXPIRED tenants through the data-lifecycle stages.
 *
 * Stage 1 (Day 30): EXPIRED → SUSPENDED (access blocked, PII still intact)
 * Stage 2 (Day 90): Anonymise all employee PII in tenant DB
 * Stage 3 (Day 180): Mark DELETED (manual DB drop follows via DBA)
 */
export async function tenantLifecycleTick(): Promise<LifecycleTickResult> {
  const cp = getControlPlane();
  const now = new Date();
  let suspended = 0;
  let softDeleted = 0;
  let hardDeleted = 0;

  // Stage 1 — grace period ended → block access
  const graceExpired = await cp.tenant.findMany({
    where: { status: "EXPIRED", gracePeriodEndsAt: { lte: now } },
    select: { id: true, companyName: true },
  });
  for (const t of graceExpired) {
    try {
      await cp.tenant.update({ where: { id: t.id }, data: { status: "SUSPENDED" } });
      await cp.platformAuditLog.create({
        data: {
          tenantId: t.id,
          action: "tenant.grace_period_ended",
          metadata: { reason: "Automatic: 30-day grace period expired" },
        },
      });
      suspended++;
    } catch (err) {
      logger.error("lifecycle: failed to suspend tenant", { tenantId: t.id, error: String(err) });
    }
  }

  // Stage 2 — soft-delete: anonymise PII
  const softDeleteQueue = await cp.tenant.findMany({
    where: { status: "SUSPENDED", softDeleteAt: { lte: now }, softDeletedAt: null },
    select: { id: true, companyName: true },
  });
  for (const t of softDeleteQueue) {
    try {
      const count = await anonymiseAllEmployees(t.id);
      await cp.tenant.update({ where: { id: t.id }, data: { softDeletedAt: now } });
      await cp.platformAuditLog.create({
        data: {
          tenantId: t.id,
          action: "tenant.soft_delete",
          metadata: { reason: "Automatic: 90-day soft-delete", anonymisedCount: count },
        },
      });
      softDeleted++;
    } catch (err) {
      logger.error("lifecycle: failed to soft-delete tenant", { tenantId: t.id, error: String(err) });
    }
  }

  // Stage 3 — hard-delete: mark DELETED (DBA drops the DB separately)
  const hardDeleteQueue = await cp.tenant.findMany({
    where: { status: "SUSPENDED", hardDeleteAt: { lte: now }, softDeletedAt: { not: null } },
    select: { id: true, companyName: true },
  });
  for (const t of hardDeleteQueue) {
    try {
      await cp.tenant.update({ where: { id: t.id }, data: { status: "DELETED" } });
      await cp.platformAuditLog.create({
        data: {
          tenantId: t.id,
          action: "tenant.hard_delete",
          metadata: { reason: "Automatic: 180-day retention period ended" },
        },
      });
      hardDeleted++;
    } catch (err) {
      logger.error("lifecycle: failed to hard-delete tenant", { tenantId: t.id, error: String(err) });
    }
  }

  logger.info("tenant lifecycle tick", { suspended, softDeleted, hardDeleted });
  return { suspended, softDeleted, hardDeleted };
}
