"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export interface LeaveTrendPoint {
  month: string;
  ANNUAL: number;
  SICK: number;
  PERSONAL: number;
  LWP: number;
}

export function useLeaveTrend() {
  const [data, setData] = useState<LeaveTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await apiFetch<LeaveTrendPoint[]>("/api/v1/hr/dashboard/leave-trend");
      setData(result);
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, refetch: fetchData };
}
