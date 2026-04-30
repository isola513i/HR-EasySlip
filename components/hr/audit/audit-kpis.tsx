"use client";

import { Shield, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card";
import { useT } from "@/lib/i18n/locale-context";
import type { AuditDateRange, AuditSummary } from "@/hooks/use-audit-logs";

interface Props {
  summary: AuditSummary;
  range: AuditDateRange;
  isLoading: boolean;
}

export function AuditKpis({ summary, range, isLoading }: Props) {
  const t = useT();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 0;
  const sub = days === 0 ? t.hr.audit.ranges.all : t.hr.audit.lastNDays.replace("{n}", String(days));

  return (
    <KpiGrid isLoading={isLoading}>
      <KpiCard Icon={Shield} label={t.hr.audit.kpiCreate} value={summary.create} sub={sub} tone="accent" />
      <KpiCard Icon={ShieldCheck} label={t.hr.audit.kpiUpdate} value={summary.update} sub={sub} tone="info" />
      <KpiCard Icon={ShieldX} label={t.hr.audit.kpiDelete} value={summary.delete} sub={sub} tone="error" />
      <KpiCard Icon={ShieldAlert} label={t.hr.audit.kpiExport} value={summary.export} sub={sub} tone="neutral" />
    </KpiGrid>
  );
}
