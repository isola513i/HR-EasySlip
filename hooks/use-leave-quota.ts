"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export interface LeaveQuotaItem {
  leaveType: string;
  allocatedDays: number;
  usedDays: number;
  available: number;
}

export function useLeaveQuota() {
  const [items, setItems] = useState<LeaveQuotaItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<LeaveQuotaItem[]>("/api/v1/leave/quota/me");
      setItems(result);
    } catch (err) {
      setItems(null);
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { items, isLoading, error, refetch: fetchData };
}
