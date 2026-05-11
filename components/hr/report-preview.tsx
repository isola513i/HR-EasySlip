"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale-context";
import { useReportPreview, type BucketDatum, type KpiTile } from "@/hooks/use-report-preview";

interface Props {
  type: string;
  dateFrom: string;
  dateTo: string;
  departmentId?: string;
}

function formatKpi(kpi: KpiTile): string {
  if (kpi.format === "hours") return `${kpi.value} h`;
  if (kpi.format === "days") return `${kpi.value} d`;
  return new Intl.NumberFormat().format(kpi.value);
}

export function ReportPreview({ type, dateFrom, dateTo, departmentId }: Props) {
  const t = useT();
  const hr = t.hr as ReturnType<typeof useT>["hr"] & {
    previewTitle: string;
    previewLoading: string;
    previewError: string;
    previewEmpty: string;
    previewKpis: Record<string, string>;
    previewSeriesTitles: Record<string, string>;
  };
  const { data, loading, error } = useReportPreview({ type, dateFrom, dateTo, departmentId });

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-(--es-shadow-sm)">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{hr.previewTitle}</h3>
        {loading && <span className="text-[11px] text-muted-foreground">{hr.previewLoading}</span>}
      </div>

      {error ? (
        <p className="text-sm text-destructive">{hr.previewError}</p>
      ) : loading && !data ? (
        <KpiSkeletons />
      ) : !data || data.kpis.length === 0 ? (
        <p className="text-sm text-muted-foreground">{hr.previewEmpty}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-border bg-background p-3">
                <div className="text-[11px] text-muted-foreground">
                  {hr.previewKpis[kpi.label] ?? kpi.label}
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{formatKpi(kpi)}</div>
              </div>
            ))}
          </div>

          {data.series.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[12px] font-medium text-muted-foreground">
                {hr.previewSeriesTitles[data.seriesTitle] ?? data.seriesTitle}
              </div>
              <BarChart data={data.series} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

function BarChart({ data }: { data: BucketDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-1.5">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-32 truncate text-[11px] text-muted-foreground">{d.label}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-(--es-accent-500)"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-12 text-right text-[11px] font-medium tabular-nums">{d.value}</span>
          </div>
        );
      })}
    </div>
  );
}
