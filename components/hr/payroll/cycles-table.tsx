"use client";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/shared/status-pill";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { PAYROLL_STATUS_TONE, type PayrollCycle } from "@/hooks/use-payroll";
import { CycleActions } from "./cycle-actions";

const GRID = "grid-cols-[80px_1.6fr_140px_180px_220px]";

interface Props {
  cycles: PayrollCycle[];
  year: number;
  yearOptions: number[];
  onYearChange: (year: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLock: (cycle: PayrollCycle) => void;
  onMarkExported: (cycle: PayrollCycle) => void;
  onDownloadTimestamps: (cycle: PayrollCycle) => void;
  onDownloadPayrollInfo: (cycle: PayrollCycle) => void;
  onDownloadEmpeoTemplate: (cycle: PayrollCycle) => void;
  isLoading: boolean;
  error: string | null;
}

export function CyclesTable({
  cycles,
  year,
  yearOptions,
  onYearChange,
  selectedId,
  onSelect,
  onLock,
  onMarkExported,
  onDownloadTimestamps,
  onDownloadPayrollInfo,
  onDownloadEmpeoTemplate,
  isLoading,
  error,
}: Props) {
  const t = useT();
  const fmt = useFormat();
  const monthName = (m: number) => fmt.formatMonthShort(`${year}-${String(m).padStart(2, "0")}`);
  const labels = {
    lock: t.hr.payrollLock,
    timestamps: t.hr.payrollTimestamps,
    export: t.hr.payrollExport,
    empeoTemplate: t.hr.payrollEmpeoTemplate,
    markExported: t.hr.payrollConfirmMarkExported,
  };
  const actionProps = { onLock, onMarkExported, onDownloadTimestamps, onDownloadPayrollInfo, onDownloadEmpeoTemplate, labels };

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold">{t.hr.payroll.cyclesTitle}</div>
          <div className="text-[12px] text-muted-foreground">{t.hr.payroll.cyclesSubtitle}</div>
        </div>
        <Select value={String(year)} onValueChange={(v) => v && onYearChange(Number(v))}>
          <SelectTrigger className="h-10 min-w-[140px]">
            <SelectValue>{(value) => String(value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 p-3 md:hidden">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
        {!isLoading && error && (
          <div className="px-2 py-8 text-center text-sm text-destructive">{error}</div>
        )}
        {!isLoading && !error && cycles.length === 0 && (
          <div className="px-2 py-12 text-center text-sm text-muted-foreground">
            {t.hr.noPayrollCycles.replace("{year}", String(year))}
          </div>
        )}
        {!isLoading && !error && cycles.map((c) => {
          const isSelected = c.id === selectedId;
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(c.id)}
              className={cn(
                "w-full rounded-xl border bg-card p-3.5 text-left shadow-[var(--es-shadow-sm)] transition-colors cursor-pointer",
                isSelected ? "border-[var(--es-accent-300)] bg-[var(--es-accent-50)] ring-1 ring-[var(--es-accent-300)]" : "border-border hover:bg-muted/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{monthName(c.month)} {c.year}</div>
                  <div className="text-[11px] tabular-nums text-muted-foreground">
                    {fmt.formatShortDate(c.cycleStart)} – {fmt.formatShortDate(c.cycleEnd)}
                  </div>
                </div>
                <StatusPill tone={PAYROLL_STATUS_TONE[c.status]}>{c.status}</StatusPill>
              </div>
              {c.lockedAt && (
                <div className="mt-1.5 text-[11px] tabular-nums text-muted-foreground">
                  {t.hr.payrollLockedAt}: {fmt.formatDateTime(c.lockedAt)}
                </div>
              )}
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <CycleActions cycle={c} {...actionProps} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <ScrollableTable minWidth={920}>
          <div className={`grid ${GRID} border-b border-border bg-[var(--es-neutral-50)] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground`}>
            <span>{t.hr.payrollMonth}</span>
            <span>{t.hr.payrollPeriod}</span>
            <span>{t.profile.status}</span>
            <span>{t.hr.payrollLockedAt}</span>
            <span>{t.hr.payrollActions}</span>
          </div>

          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`grid ${GRID} items-center border-b border-[var(--es-neutral-100)] px-5 py-3.5`}>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}

          {!isLoading && error && (
            <div className="px-4 py-8 text-center text-sm text-destructive">{error}</div>
          )}

          {!isLoading && !error && cycles.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {t.hr.noPayrollCycles.replace("{year}", String(year))}
            </div>
          )}

          {!isLoading && !error && cycles.map((c) => {
            const isSelected = c.id === selectedId;
            return (
              <div
                key={c.id}
                role="row"
                onClick={() => onSelect(c.id)}
                className={cn(
                  `grid ${GRID} w-full items-center border-b border-[var(--es-neutral-100)] px-5 py-3.5 text-[13px] transition-colors last:border-b-0 cursor-pointer`,
                  isSelected ? "bg-[var(--es-accent-50)]" : "hover:bg-muted/40",
                )}
              >
                <span className="font-semibold">{monthName(c.month)}</span>
                <span className="tabular-nums text-muted-foreground">
                  {fmt.formatShortDate(c.cycleStart)} – {fmt.formatShortDate(c.cycleEnd)}
                </span>
                <span><StatusPill tone={PAYROLL_STATUS_TONE[c.status]}>{c.status}</StatusPill></span>
                <span className="tabular-nums text-muted-foreground">
                  {c.lockedAt ? fmt.formatDateTime(c.lockedAt) : "—"}
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <CycleActions cycle={c} {...actionProps} />
                </div>
              </div>
            );
          })}
        </ScrollableTable>
      </div>
    </div>
  );
}
