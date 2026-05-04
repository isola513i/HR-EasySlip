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
}

const KEYS = [
  "leave.annual.full_year_days",
  "leave.annual.rounding_step",
  "leave.annual.days_in_year_basis",
  "leave.sick.max_paid_days",
  "leave.personal.max_days",
  "leave.maternity.days",
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
    maternityDays: Number(v["leave.maternity.days"] ?? 98),
  };
}
