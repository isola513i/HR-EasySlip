"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import type { DashboardData } from "@/lib/hr/dashboard-service";

export function useHRDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<DashboardData>("/api/v1/hr/dashboard");
      setData(result);
    } catch (err) {
      setData(null);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
