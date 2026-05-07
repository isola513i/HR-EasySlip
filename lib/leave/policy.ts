import { getSettingValues } from "@/lib/settings/settings-service";
import {
  DEFAULT_ANNUAL_LEAVE_POLICY,
  type AnnualLeavePolicy,
} from "./annual-quota-engine";

export interface LeavePolicy {
  annual: AnnualLeavePolicy;
  sickMaxPaidDays: number;
  personalMaxDays: number;
  maternityDays: number;
  paternityDays: number;
  childCareDays: number;
  ordinationDays: number;
  militaryDays: number;
  funeralDays: number;
  trainingDays: number;
}

const KEYS = [
  "leave.annual.full_year_days",
  "leave.annual.rounding_step",
  "leave.annual.days_in_year_basis",
  "leave.sick.max_paid_days",
  "leave.personal.max_days",
  "leave.maternity.days",
  "leave.paternity.days",
  "leave.child_care.days",
  "leave.ordination.days",
  "leave.military.days",
  "leave.funeral.days",
  "leave.training.days",
];

export async function loadLeavePolicy(): Promise<LeavePolicy> {
  const v = await getSettingValues(KEYS);
  return {
    annual: {
      fullYearDays: Number(v["leave.annual.full_year_days"] ?? DEFAULT_ANNUAL_LEAVE_POLICY.fullYearDays),
      roundingStep: Number(v["leave.annual.rounding_step"] ?? DEFAULT_ANNUAL_LEAVE_POLICY.roundingStep),
      daysInYearBasis: Number(v["leave.annual.days_in_year_basis"] ?? DEFAULT_ANNUAL_LEAVE_POLICY.daysInYearBasis),
    },
    sickMaxPaidDays: Number(v["leave.sick.max_paid_days"] ?? 30),
    personalMaxDays: Number(v["leave.personal.max_days"] ?? 3),
    // MATERNITY: 120 days under updated Thai law (60 paid by company, balance via SSO)
    maternityDays: Number(v["leave.maternity.days"] ?? 120),
    // PATERNITY: 15 days (civil servant act baseline; common private-sector ceiling)
    paternityDays: Number(v["leave.paternity.days"] ?? 15),
    // CHILD_CARE: 15 days, requires medical cert (severe child illness)
    childCareDays: Number(v["leave.child_care.days"] ?? 15),
    // ORDINATION: 120 days max, once-in-lifetime
    ordinationDays: Number(v["leave.ordination.days"] ?? 120),
    // MILITARY: 60 days nominal (per call-up); HR adjusts per actual order
    militaryDays: Number(v["leave.military.days"] ?? 60),
    // FUNERAL: 7 days (close family) — yearly cap
    funeralDays: Number(v["leave.funeral.days"] ?? 7),
    // TRAINING: 5 days yearly (company policy)
    trainingDays: Number(v["leave.training.days"] ?? 5),
  };
}
