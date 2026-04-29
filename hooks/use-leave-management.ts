"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import type { LeaveTypeStats, PendingLeaveRow } from "@/lib/leave/leave-org-stats-service";

export function useLeaveManagement() {
  const [stats, setStats] = useState<LeaveTypeStats[]>([]);
  const [pending, setPending] = useState<PendingLeaveRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, p] = await Promise.all([
        apiFetch<LeaveTypeStats[]>("/api/v1/hr/leave/stats"),
        apiFetch<PendingLeaveRow[]>("/api/v1/hr/leave/pending"),
      ]);
      setStats(s);
      setPending(p);
    } catch {
      setStats([]);
      setPending([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const approve = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/hr/leave/${id}/approve`, { method: "POST" });
    await fetchAll();
  }, [fetchAll]);

  const reject = useCallback(async (id: string, reason: string) => {
    await apiFetch(`/api/v1/hr/leave/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    await fetchAll();
  }, [fetchAll]);

  return { stats, pending, isLoading, approve, reject, refetch: fetchAll };
}
