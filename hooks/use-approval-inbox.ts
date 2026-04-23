"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiFetchPaginated } from "@/lib/api/client";
import type { ApiPaginated } from "@/types/api";
import type { ApprovalRow } from "@/types/manager";

type Pagination = ApiPaginated<unknown>["pagination"];

export function useApprovalInbox() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchPending = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetchPaginated<ApprovalRow>(
        `/api/v1/leave/approvals/pending?page=${p}&perPage=20`,
      );
      setRows(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load approvals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(page); }, [page, fetchPending]);

  const refetch = useCallback(() => fetchPending(page), [page, fetchPending]);

  const approve = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/leave/requests/${id}/approve`, { method: "POST" });
    await refetch();
  }, [refetch]);

  const reject = useCallback(async (id: string, reason: string) => {
    await apiFetch(`/api/v1/leave/requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    await refetch();
  }, [refetch]);

  const bulkDecision = useCallback(
    async (ids: string[], decision: "APPROVED" | "REJECTED", reason?: string) => {
      const results = await apiFetch<{ id: string; ok: boolean; error?: string }[]>(
        "/api/v1/leave/approvals/bulk",
        { method: "POST", body: JSON.stringify({ ids, decision, reason }) },
      );
      await refetch();
      return results;
    },
    [refetch],
  );

  return {
    rows, isLoading, error, pagination, page, setPage,
    approve, reject, bulkDecision, refetch,
  };
}
