// ════════════════════════════════════════════════════════════════
// PDPA Overview Service — HR-side aggregation for /hr/pdpa dashboard
// ════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { CONSENT_PURPOSE, CONSENT_VERSION } from "./consent-service";
import {
  CONSENT_CATEGORIES,
  REQUIRED_CATEGORIES,
  gradeFromRate,
  type ConsentCategory,
  type ConsentStatus,
} from "./categories";

// Next review = 6 months after the policy version (semi-annual review cycle).
// This is a fixed cadence anchored to the policy's publish date — it does NOT
// shift forward when employees grant consent.
const POLICY_ANCHOR = new Date("2026-04-30T00:00:00.000Z");
const REVIEW_INTERVAL_MONTHS = 6;

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
  // Pull active employees (ACTIVE + PROBATION) — resigned/terminated/suspended
  // are excluded from compliance counting. Same convention as
  // attendance-dashboard-service and payroll-info-exporter.
  const employees = await prisma.employee.findMany({
    where: {
      anonymizedAt: null,
      employmentStatus: { in: ["ACTIVE", "PROBATION"] },
    },
    select: {
      id: true,
      employeeCode: true,
      firstNameTh: true,
      lastNameTh: true,
      firstNameEn: true,
      lastNameEn: true,
      userId: true,
      user: { select: { email: true } },
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
    select: { userId: true, granted: true, grantedAt: true, withdrawnAt: true },
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
  // Future schema can store per-category opt-outs and split optional categories' counts.
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
