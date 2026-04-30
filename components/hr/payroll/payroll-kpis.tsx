"use client";

import { CalendarClock, CalendarDays, Download, Lock } from "lucide-react";
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card";
import { useT } from "@/lib/i18n/locale-context";
import type { PayrollCycle } from "@/hooks/use-payroll";

interface Props {
  cycles: PayrollCycle[];
  year: number;
  isLoading: boolean;
}

export function PayrollKpis({ cycles, year, isLoading }: Props) {
  const t = useT();
  const sub = t.hr.payroll.kpiSubFmt.replace("{year}", String(year));
  const open = cycles.filter((c) => c.status === "OPEN").length;
  const locked = cycles.filter((c) => c.status === "LOCKED").length;
  const exported = cycles.filter((c) => c.status === "EXPORTED").length;

  return (
    <KpiGrid isLoading={isLoading}>
      <KpiCard Icon={CalendarDays} label={t.hr.payroll.kpiTotalCycles} value={cycles.length} sub={sub} tone="accent" />
      <KpiCard Icon={CalendarClock} label={t.hr.payroll.kpiOpen} value={open} sub={sub} tone="info" />
      <KpiCard Icon={Lock} label={t.hr.payroll.kpiLocked} value={locked} sub={sub} tone="warn" />
      <KpiCard Icon={Download} label={t.hr.payroll.kpiExported} value={exported} sub={sub} tone="success" />
    </KpiGrid>
  );
}
