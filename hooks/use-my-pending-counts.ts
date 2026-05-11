"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export interface PendingCounts {
  leave: number;
  ot: number;
  expense: number;
}

interface PagedTotal {
  total: number;
}

export function useMyPendingCounts() {
  const [counts, setCounts] = useState<PendingCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = useCallback(async (signal?: AbortSignal) => {
    try {
      const [leave, ot, expense] = await Promise.all([
        apiFetch<PagedTotal>("/api/v1/leave/requests/me?status=PENDING&perPage=1", { signal }),
        apiFetch<PagedTotal>("/api/v1/overtime/requests/me?status=PENDING&perPage=1", { signal }),
        apiFetch<PagedTotal>("/api/v1/expense/me?status=PENDING&perPage=1", { signal }),
      ]);
      setCounts({ leave: leave.total, ot: ot.total, expense: expense.total });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setCounts({ leave: 0, ot: 0, expense: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchCounts(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchCounts]);

  return { counts, isLoading };
}
