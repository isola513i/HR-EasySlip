"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export interface KpiTile {
  label: string;
  value: number;
  format?: "number" | "hours" | "days";
}

export interface BucketDatum {
  label: string;
  value: number;
}

export interface ReportPreview {
  kpis: KpiTile[];
  series: BucketDatum[];
  seriesTitle: string;
}

interface Args {
  type: string;
  dateFrom: string;
  dateTo: string;
  departmentId?: string;
  enabled?: boolean;
}

export function useReportPreview({ type, dateFrom, dateTo, departmentId, enabled = true }: Args) {
  const [data, setData] = useState<ReportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !type || !dateFrom || !dateTo) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ type, dateFrom, dateTo });
    if (departmentId) params.set("departmentId", departmentId);
    apiFetch<ReportPreview>(`/api/v1/hr/reports/preview?${params.toString()}`)
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [type, dateFrom, dateTo, departmentId, enabled]);

  return { data, loading, error };
}
