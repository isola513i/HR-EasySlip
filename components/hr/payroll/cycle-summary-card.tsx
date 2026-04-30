"use client";

import { Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/status-pill";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { PAYROLL_STATUS_TONE, type PayrollCycle } from "@/hooks/use-payroll";

interface Props {
  cycle: PayrollCycle | null;
  year: number;
  onLock: (cycle: PayrollCycle) => void;
  onExport: (cycle: PayrollCycle) => void;
}

function workingDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return count;
}

export function CycleSummaryCard({ cycle, year, onLock, onExport }: Props) {
  const t = useT();
  const fmt = useFormat();

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="border-b border-border px-5 py-4 text-base font-semibold">
        {t.hr.payroll.cycleSummaryTitle}
      </div>
      {!cycle ? (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          {t.hr.payroll.cycleSummaryEmpty}
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <div className="rounded-lg bg-[var(--es-neutral-50)] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[16px] font-semibold">
                  {fmt.formatMonthShort(`${year}-${String(cycle.month).padStart(2, "0")}`)} {year}
                </div>
                <div className="mt-0.5 text-[12px] tabular-nums text-muted-foreground">
                  {fmt.formatShortDate(cycle.cycleStart, "numeric")} – {fmt.formatShortDate(cycle.cycleEnd, "numeric")}
                </div>
              </div>
              <StatusPill tone={PAYROLL_STATUS_TONE[cycle.status]}>{cycle.status}</StatusPill>
            </div>

            <div className="mt-4 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.hr.payroll.cycleSummaryDays}</span>
                <span className="font-semibold tabular-nums">{workingDays(cycle.cycleStart, cycle.cycleEnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.hr.payroll.cycleSummaryLocked}</span>
                <span className="font-semibold tabular-nums text-right">
                  {cycle.lockedAt ? fmt.formatDateTime(cycle.lockedAt) : "—"}
                </span>
              </div>
            </div>
          </div>

          {cycle.status === "OPEN" && (
            <Button onClick={() => onLock(cycle)} variant="outline" className="w-full gap-1.5">
              <Lock className="size-4" />
              {t.hr.payroll.cycleSummaryLockButton}
            </Button>
          )}
          {(cycle.status === "LOCKED" || cycle.status === "EXPORTED") && (
            <Button onClick={() => onExport(cycle)} className="w-full gap-1.5">
              <Download className="size-4" />
              {t.hr.payroll.cycleSummaryExportButton}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
