"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiFetchPaginated } from "@/lib/api/client";
import type { AuditModule } from "@/lib/audit/categories";

export interface AuditEntry {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
  createdAt: string;
  actor: { id: string; email: string } | null;
}

export type AuditDateRange = "7d" | "30d" | "90d" | "all";

export interface AuditSummary {
  create: number;
  update: number;
  delete: number;
  export: number;
  other: number;
  rangeTotal: number;
  grandTotal: number;
}

const DEFAULT_SUMMARY: AuditSummary = {
  create: 0,
  update: 0,
  delete: 0,
  export: 0,
  other: 0,
  rangeTotal: 0,
  grandTotal: 0,
};

const PER_PAGE = 10;

function dateRangeToISO(range: AuditDateRange): { from?: string; to?: string } {
  if (range === "all") return {};
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [summary, setSummary] = useState<AuditSummary>(DEFAULT_SUMMARY);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<AuditModule | "ALL">("ALL");
  const [dateRange, setDateRange] = useState<AuditDateRange>("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildBaseParams = useCallback(() => {
    const { from, to } = dateRangeToISO(dateRange);
    const base = new URLSearchParams();
    if (search.trim()) base.set("action", search.trim());
    if (moduleFilter !== "ALL") base.set("module", moduleFilter);
    if (from) base.set("from", from);
    if (to) base.set("to", to);
    return base;
  }, [search, moduleFilter, dateRange]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    const listParams = new URLSearchParams(buildBaseParams());
    listParams.set("page", String(page));
    listParams.set("perPage", String(PER_PAGE));
    apiFetchPaginated<AuditEntry>(`/api/v1/audit/logs?${listParams}`)
      .then((list) => {
        if (cancelled) return;
        setLogs(list.data);
        setTotal(list.pagination.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setLogs([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "Failed to load audit logs");
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [buildBaseParams, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<AuditSummary>(`/api/v1/audit/logs/summary?${buildBaseParams()}`)
      .then((sum) => { if (!cancelled) setSummary(sum); })
      .catch(() => { if (!cancelled) setSummary(DEFAULT_SUMMARY); });
    return () => { cancelled = true; };
  }, [buildBaseParams]);

  useEffect(() => {
    setPage(1);
  }, [search, moduleFilter, dateRange]);

  return {
    logs,
    summary,
    page,
    setPage,
    total,
    perPage: PER_PAGE,
    totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
    search,
    setSearch,
    moduleFilter,
    setModuleFilter,
    dateRange,
    setDateRange,
    isLoading,
    error,
  };
}
