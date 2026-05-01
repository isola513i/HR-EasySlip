"use client";

import { Download, FileText, Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/status-pill";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { PAYROLL_STATUS_TONE, type PayrollCycle } from "@/hooks/use-payroll";

const GRID = "grid-cols-[80px_1.6fr_140px_180px_220px]";

interface Props {
  cycles: PayrollCycle[];
  year: number;
  yearOptions: number[];
  onYearChange: (year: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLock: (cycle: PayrollCycle) => void;
  onDownloadTimestamps: (cycle: PayrollCycle) => void;
  onDownloadPayrollInfo: (cycle: PayrollCycle) => void;
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
  onDownloadTimestamps,
  onDownloadPayrollInfo,
  isLoading,
  error,
}: Props) {
  const t = useT();
  const fmt = useFormat();
  const monthName = (m: number) => fmt.formatMonthShort(`${year}-${String(m).padStart(2, "0")}`);

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
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                `grid ${GRID} w-full items-center border-b border-[var(--es-neutral-100)] px-5 py-3.5 text-left text-[13px] transition-colors last:border-b-0`,
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
              <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                {c.status === "OPEN" && (
                  <Button size="sm" variant="outline" onClick={() => onLock(c)}>
                    <Lock className="mr-1 size-3.5" /> {t.hr.payrollLock}
                  </Button>
                )}
                {(c.status === "LOCKED" || c.status === "EXPORTED") && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => onDownloadTimestamps(c)}>
                      <FileText className="mr-1 size-3.5" /> {t.hr.payrollTimestamps}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDownloadPayrollInfo(c)}>
                      <Download className="mr-1 size-3.5" /> {t.hr.payrollExport}
                    </Button>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </ScrollableTable>
    </div>
  );
}
