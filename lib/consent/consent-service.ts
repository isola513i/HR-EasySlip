import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import {
  CONSENT_CATEGORIES,
  REQUIRED_CATEGORIES,
  gradeFromRate,
  type ConsentCategory,
  type ConsentStatus,
} from "./categories";

interface RequestMeta {
  ip: string;
  userAgent: string;
}

export const CONSENT_PURPOSE = "PDPA-EmployeeData-v1";
export const CONSENT_VERSION = "1.0";

// Next review = 6 months after the policy version (semi-annual review cycle).
// Policy version updated date is sourced from the most recent grant in DB,
// or falls back to a static anchor for empty environments.
const POLICY_ANCHOR = new Date("2026-04-30T00:00:00.000Z");
const REVIEW_INTERVAL_MONTHS = 6;

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

interface PdpaEmployeeRecord {
  employeeId: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  email: string | null;
  status: ConsentStatus;
  consentType: "ALL" | "BASIC" | "NONE";
  grantedAt: string | null;
}

export interface PdpaOverview {
  totals: {
    totalEmployees: number;
    consented: number;
    pending: number;
    withdrawn: number;
    partial: number;
    consentRate: number;
    complianceGrade: ReturnType<typeof gradeFromRate>;
  };
  policy: {
    purpose: string;
    version: string;
    lastUpdatedAt: string;
    nextReviewAt: string;
  };
  categories: Array<{
    key: ConsentCategory;
    required: boolean;
    consented: number;
  }>;
  records: PdpaEmployeeRecord[];
}

export async function getPdpaOverview(): Promise<PdpaOverview> {
  // Pull active employees and their latest consent record (granted=true OR withdrawn).
  const employees = await prisma.employee.findMany({
    where: { anonymizedAt: null },
    select: {
      id: true,
      employeeCode: true,
      firstNameTh: true,
      lastNameTh: true,
      firstNameEn: true,
      lastNameEn: true,
      userId: true,
      user: {
        select: { email: true },
      },
    },
    orderBy: { employeeCode: "asc" },
  });

  const userIds = employees.map((e) => e.userId);
  const consents = await prisma.consentRecord.findMany({
    where: {
      userId: { in: userIds },
      purpose: CONSENT_PURPOSE,
      version: CONSENT_VERSION,
    },
    orderBy: { grantedAt: "desc" },
    select: {
      userId: true,
      granted: true,
      grantedAt: true,
      withdrawnAt: true,
    },
  });

  const latestByUser = new Map<string, (typeof consents)[number]>();
  for (const c of consents) {
    if (!latestByUser.has(c.userId)) latestByUser.set(c.userId, c);
  }

  const records: PdpaEmployeeRecord[] = employees.map((emp) => {
    const consent = latestByUser.get(emp.userId);
    let status: ConsentStatus = "PENDING";
    let consentType: PdpaEmployeeRecord["consentType"] = "NONE";
    let grantedAt: string | null = null;

    if (consent?.granted && !consent.withdrawnAt) {
      status = "CONSENTED";
      consentType = "ALL";
      grantedAt = consent.grantedAt?.toISOString() ?? null;
    } else if (consent && (!consent.granted || consent.withdrawnAt)) {
      status = "WITHDRAWN";
      consentType = "NONE";
      grantedAt = consent.grantedAt?.toISOString() ?? null;
    }

    return {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      firstNameTh: emp.firstNameTh,
      lastNameTh: emp.lastNameTh,
      firstNameEn: emp.firstNameEn,
      lastNameEn: emp.lastNameEn,
      email: emp.user?.email ?? null,
      status,
      consentType,
      grantedAt,
    };
  });

  const consented = records.filter((r) => r.status === "CONSENTED").length;
  const pending = records.filter((r) => r.status === "PENDING").length;
  const withdrawn = records.filter((r) => r.status === "WITHDRAWN").length;
  const total = records.length;
  const consentRate = total === 0 ? 0 : Math.round((consented / total) * 1000) / 10;
  const complianceGrade = gradeFromRate(consentRate);

  // Categories: with binary backend, every CONSENTED employee = consented to ALL categories.
  // Optional categories are reported the same; future schema can store per-category opt-outs.
  const categories = CONSENT_CATEGORIES.map((key) => ({
    key,
    required: (REQUIRED_CATEGORIES as readonly ConsentCategory[]).includes(key),
    consented,
  }));

  const lastUpdatedAt = consents[0]?.grantedAt?.toISOString() ?? POLICY_ANCHOR.toISOString();
  const nextReview = new Date(POLICY_ANCHOR);
  nextReview.setMonth(nextReview.getMonth() + REVIEW_INTERVAL_MONTHS);

  return {
    totals: {
      totalEmployees: total,
      consented,
      pending,
      withdrawn,
      partial: 0,
      consentRate,
      complianceGrade,
    },
    policy: {
      purpose: CONSENT_PURPOSE,
      version: CONSENT_VERSION,
      lastUpdatedAt,
      nextReviewAt: nextReview.toISOString(),
    },
    categories,
    records,
  };
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
