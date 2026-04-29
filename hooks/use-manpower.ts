"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ManpowerEmployee } from "@/lib/hr/manpower-service";

interface ManpowerResponse {
  date: string;
  employees: ManpowerEmployee[];
}

export function useManpower(dateStr: string) {
  const [data, setData] = useState<ManpowerEmployee[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (date: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<ManpowerResponse>(`/api/v1/hr/manpower?date=${encodeURIComponent(date)}`);
      setData(result.employees);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load manpower");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateStr);
  }, [dateStr, fetchData]);

  return { data, isLoading, error };
}
