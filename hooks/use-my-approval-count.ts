"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

interface PagedTotal {
  total: number;
}

export function useMyApprovalCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async (signal?: AbortSignal) => {
    try {
      const [leave, ot, timeAdj] = await Promise.all([
        apiFetch<PagedTotal>("/api/v1/leave/approvals/pending?perPage=1", { signal }),
        apiFetch<PagedTotal>("/api/v1/overtime/approvals/pending?perPage=1", { signal }),
        apiFetch<PagedTotal>("/api/v1/attendance/adjustment/pending?perPage=1", { signal }),
      ]);
      setCount(leave.total + ot.total + timeAdj.total);
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchCount(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchCount]);

  return { count, isLoading };
}
