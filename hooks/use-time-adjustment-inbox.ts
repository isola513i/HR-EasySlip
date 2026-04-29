"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiFetchPaginated } from "@/lib/api/client";
import type { TimeAdjustmentRow } from "@/types/manager-inbox";

export function useTimeAdjustmentInbox() {
  const [rows, setRows] = useState<TimeAdjustmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetchPaginated<TimeAdjustmentRow>(
        `/api/v1/attendance/adjustment/pending?perPage=50`,
      );
      setRows(result.data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const approve = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/attendance/adjustment/${id}/approve`, { method: "POST" });
    await fetchPending();
  }, [fetchPending]);

  const reject = useCallback(async (id: string, reason: string) => {
    await apiFetch(`/api/v1/attendance/adjustment/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    await fetchPending();
  }, [fetchPending]);

  return { rows, isLoading, error, approve, reject, refetch: fetchPending };
}
