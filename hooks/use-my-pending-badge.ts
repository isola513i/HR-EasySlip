"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

interface PagedTotal { total: number }

export function useMyPendingBadge(): boolean {
  const [hasPending, setHasPending] = useState(false);

  const check = useCallback(async (signal?: AbortSignal) => {
    try {
      const [leave, ot, expense] = await Promise.all([
        apiFetch<PagedTotal>("/api/v1/leave/requests/me?status=PENDING&perPage=1", { signal }),
        apiFetch<PagedTotal>("/api/v1/overtime/requests/me?status=PENDING&perPage=1", { signal }),
        apiFetch<PagedTotal>("/api/v1/expense/me?status=PENDING&perPage=1", { signal }),
      ]);
      setHasPending(leave.total + ot.total + expense.total > 0);
    } catch {
      // stay silent — badge is best-effort
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void check(ctrl.signal);
    return () => ctrl.abort();
  }, [check]);

  return hasPending;
}
