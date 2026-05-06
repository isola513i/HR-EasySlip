"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { SectionLabel } from "@/components/shared/section-label";
import { PillToggleGroup } from "@/components/shared/pill-toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { useTimesheet, type TimesheetRange } from "@/hooks/use-timesheet";
import type { TimesheetEntry } from "@/hooks/use-timesheet";
import { downloadCsv } from "@/lib/download";
import { formatHM } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { TimeCorrectionDialog } from "@/components/employee/time-correction-dialog";
import { SummaryCard } from "@/components/employee/timesheet/summary-card";
import { TimesheetRow } from "@/components/employee/timesheet/timesheet-row";

type CsvHeaders = Dictionary["timesheet"]["csv"];

function buildTimesheetCsv(entries: TimesheetEntry[], headers: CsvHeaders): string[][] {
  const headerRow = [
    headers.date, headers.firstIn, headers.lastOut,
    headers.workedMinutes, headers.lateMinutes, headers.location, headers.backfilled,
  ];
  const rows = entries.map((e) => [
    e.date,
    e.firstIn ?? "",
    e.lastOut ?? "",
    String(e.workedMinutes),
    String(e.lateMinutes),
    e.workLocation ?? "",
    e.hasBackfill ? "yes" : "no",
  ]);
  return [headerRow, ...rows];
}

export function TimesheetScreen() {
  const t = useT();
  const fmt = useFormat();
  const tsT = t.timesheet;
  const { range, setRange, data, loading, error, dates, refetch } = useTimesheet();
  const [correctionDate, setCorrectionDate] = useState<string | null>(null);

  const entries = data?.entries ?? [];
  const summary = data?.summary;

  const totalHoursDisplay = summary
    ? formatHM(summary.workedMinutes, tsT.hoursAbbr, tsT.minutesAbbr)
    : "—";

  const rangeOptions = useMemo(
    () => [
      { key: "7d" as const, label: tsT.last7days },
      { key: "30d" as const, label: tsT.last30days },
      { key: "thisMonth" as const, label: tsT.thisMonth },
      { key: "lastMonth" as const, label: tsT.lastMonth },
    ],
    [tsT.last7days, tsT.last30days, tsT.thisMonth, tsT.lastMonth],
  );

  return (
    <>
      <MobileTopbar title={tsT.title} />

      <div className="flex flex-col gap-5 p-4">
        <div>
          <SectionLabel>{tsT.subtitle}</SectionLabel>
          <PillToggleGroup
            options={rangeOptions}
            value={range}
            onChange={(v) => setRange(v as TimesheetRange)}
            variant="filled"
            ariaLabel={tsT.subtitle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label={tsT.summaryDays} value={loading ? null : String(summary?.totalDays ?? 0)} />
          <SummaryCard label={tsT.summaryHours} value={loading ? null : totalHoursDisplay} />
          <SummaryCard
            label={tsT.summaryLate}
            value={loading ? null : String(summary?.lateDays ?? 0)}
            highlight={Boolean(summary?.lateDays)}
          />
          <SummaryCard
            label={tsT.summaryAvg}
            value={loading ? null : formatHM(summary?.averageMinutesPerDay ?? 0, tsT.hoursAbbr, tsT.minutesAbbr)}
          />
        </div>

        <button
          type="button"
          disabled={loading || entries.length === 0}
          onClick={() => downloadCsv(buildTimesheetCsv(entries, tsT.csv), `timesheet_${dates.from}_${dates.to}.csv`)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4" strokeWidth={2} />
          {tsT.exportCsv}
        </button>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {tsT.noRecords}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {entries.map((entry, idx) => (
              <TimesheetRow
                key={entry.date}
                entry={entry}
                isFirst={idx === 0}
                fmt={fmt}
                t={tsT}
                onRequestCorrection={() => setCorrectionDate(entry.date)}
              />
            ))}
          </div>
        )}
      </div>

      <TimeCorrectionDialog
        open={correctionDate !== null}
        onClose={() => { setCorrectionDate(null); refetch(); }}
        date={correctionDate ?? ""}
      />
    </>
  );
}
