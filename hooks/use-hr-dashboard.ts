"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import type { DashboardData } from "@/lib/hr/dashboard-service";
import type { DashboardTrends } from "@/lib/hr/dashboard-trends-service";

type FullDashboardData = DashboardData & Partial<DashboardTrends>;

export function useHRDashboard() {
  const [data, setData] = useState<FullDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<FullDashboardData>("/api/v1/hr/dashboard?include=trends");
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
