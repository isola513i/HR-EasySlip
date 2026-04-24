"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetchPaginated } from "@/lib/api/client";

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
  createdAt: string;
  actor: { id: string; email: string };
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (q: string, p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), perPage: "50" });
      if (q.trim()) params.set("action", q.trim());
      const result = await apiFetchPaginated<AuditEntry>(
        `/api/v1/audit/logs?${params.toString()}`,
      );
      setLogs(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setLogs([]);
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(search, page);
  }, [search, page, fetchLogs]);

  return { logs, page, setPage, totalPages, search, setSearch, isLoading, error };
}
