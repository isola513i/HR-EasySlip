"use client";

import { AlarmClock, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  totalHours: number;
  pendingCount: number;
  approvedCount: number;
  approvedDeltaPct: number | null;
  avgPerEmployee: number;
  isLoading: boolean;
}

export function OvertimeKpis({
  totalHours,
  pendingCount,
  approvedCount,
  approvedDeltaPct,
  avgPerEmployee,
  isLoading,
}: Props) {
  const t = useT();
  const u = t.hr.overtime.hoursUnit;

  const approvedSub =
    approvedDeltaPct == null
      ? t.hr.overtime.kpiPendingSub
      : t.hr.overtime.kpiApprovedSubFmt.replace(
          "{value}",
          `${approvedDeltaPct >= 0 ? "+" : ""}${approvedDeltaPct.toFixed(0)}%`,
        );

  return (
    <KpiGrid isLoading={isLoading}>
      <KpiCard Icon={Clock} label={t.hr.overtime.kpiTotalHours} value={`${totalHours.toFixed(0)}${u}`} sub={t.hr.overtime.kpiTotalHoursSub} tone="accent" />
      <KpiCard Icon={AlarmClock} label={t.hr.overtime.kpiPending} value={pendingCount} sub={t.hr.overtime.kpiPendingSub} tone="warn" />
      <KpiCard Icon={CheckCircle2} label={t.hr.overtime.kpiApproved} value={approvedCount} sub={approvedSub} tone="success" />
      <KpiCard Icon={CalendarDays} label={t.hr.overtime.kpiAvg} value={`${avgPerEmployee.toFixed(1)}${u}`} sub={t.hr.overtime.kpiAvgSub} tone="info" />
    </KpiGrid>
  );
}
