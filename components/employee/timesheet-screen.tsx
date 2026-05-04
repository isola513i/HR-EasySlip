"use client";

import { useMemo } from "react";
import { Download, MapPin, Home, Building2 } from "lucide-react";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { useTimesheet, type TimesheetRange } from "@/hooks/use-timesheet";
import type { TimesheetEntry } from "@/hooks/use-timesheet";
import { downloadCsv } from "@/lib/download";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type CsvHeaders = Dictionary["timesheet"]["csv"];

const RANGE_OPTIONS: { value: TimesheetRange; key: "last7days" | "last30days" | "thisMonth" | "lastMonth" }[] = [
  { value: "7d", key: "last7days" },
  { value: "30d", key: "last30days" },
  { value: "thisMonth", key: "thisMonth" },
  { value: "lastMonth", key: "lastMonth" },
];

function formatHM(minutes: number, hAbbr: string, mAbbr: string) {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}${mAbbr}`;
  if (m === 0) return `${h}${hAbbr}`;
  return `${h}${hAbbr} ${m}${mAbbr}`;
}

function LocationIcon({ loc }: { loc: TimesheetEntry["workLocation"] }) {
  if (loc === "WFH") return <Home className="size-3.5" aria-hidden />;
  if (loc === "ON_SITE") return <MapPin className="size-3.5" aria-hidden />;
  return <Building2 className="size-3.5" aria-hidden />;
}

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
  const { range, setRange, data, loading, error, dates } = useTimesheet();

  const entries = data?.entries ?? [];
  const summary = data?.summary;

  const totalHoursDisplay = useMemo(() => {
    if (!summary) return "—";
    return formatHM(summary.workedMinutes, tsT.hoursAbbr, tsT.minutesAbbr);
  }, [summary, tsT.hoursAbbr, tsT.minutesAbbr]);

  return (
    <>
      <MobileTopbar title={tsT.title} backHref="/employee/today" />

      <div className="flex flex-col gap-4 p-4">
        <p className="text-[12px] text-muted-foreground">{tsT.subtitle}</p>

        {/* Range chips */}
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => {
            const active = range === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                aria-pressed={active}
                className={
                  "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors " +
                  (active
                    ? "border-[var(--es-accent-600)] bg-[var(--es-accent-50)] text-[var(--es-accent-700)]"
                    : "border-border bg-card text-muted-foreground hover:bg-muted")
                }
              >
                {tsT[opt.key]}
              </button>
            );
          })}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard label={tsT.summaryDays} value={loading ? null : String(summary?.totalDays ?? 0)} />
          <SummaryCard label={tsT.summaryHours} value={loading ? null : totalHoursDisplay} />
          <SummaryCard label={tsT.summaryLate} value={loading ? null : String(summary?.lateDays ?? 0)} highlight={Boolean(summary?.lateDays)} />
          <SummaryCard
            label={tsT.summaryAvg}
            value={loading ? null : formatHM(summary?.averageMinutesPerDay ?? 0, tsT.hoursAbbr, tsT.minutesAbbr)}
          />
        </div>

        {/* Export */}
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading || entries.length === 0}
            onClick={() => downloadCsv(buildTimesheetCsv(entries, tsT.csv), `timesheet_${dates.from}_${dates.to}.csv`)}
          >
            <Download className="mr-1.5 size-3.5" />
            {tsT.exportCsv}
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-center text-sm text-destructive">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {tsT.noRecords}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {entries.map((entry, idx) => (
              <TimesheetRow
                key={entry.date}
                entry={entry}
                isFirst={idx === 0}
                fmt={fmt}
                t={tsT}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string | null; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      {value === null ? (
        <Skeleton className="mt-1 h-6 w-16" />
      ) : (
        <div className={"mt-1 text-lg font-semibold tabular-nums " + (highlight ? "text-amber-600" : "text-foreground")}>
          {value}
        </div>
      )}
    </div>
  );
}

function TimesheetRow({
  entry,
  isFirst,
  fmt,
  t,
}: {
  entry: TimesheetEntry;
  isFirst: boolean;
  fmt: ReturnType<typeof useFormat>;
  t: ReturnType<typeof useT>["timesheet"];
}) {
  return (
    <div className={"flex items-center gap-3 px-3 py-3 " + (isFirst ? "" : "border-t border-border")}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">{fmt.formatDate(entry.date)}</span>
          {entry.workLocation && (
            <Badge variant="outline" className="h-5 gap-1 text-[10px]">
              <LocationIcon loc={entry.workLocation} />
              {(t.locations as Record<string, string>)[entry.workLocation] ?? entry.workLocation}
            </Badge>
          )}
          {entry.hasBackfill && <Badge variant="outline" className="h-5 text-[10px]">{t.backfilled}</Badge>}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
          <span>{t.firstIn}: {entry.firstIn ? fmt.formatTime(entry.firstIn) : "—"}</span>
          <span>{t.lastOut}: {entry.lastOut ? fmt.formatTime(entry.lastOut) : "—"}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13px] font-semibold tabular-nums">
          {formatHM(entry.workedMinutes, t.hoursAbbr, t.minutesAbbr)}
        </div>
        {entry.lateMinutes > 0 && (
          <div className="text-[10px] font-medium text-amber-600 tabular-nums">
            {t.late} {formatHM(entry.lateMinutes, t.hoursAbbr, t.minutesAbbr)}
          </div>
        )}
      </div>
    </div>
  );
}
