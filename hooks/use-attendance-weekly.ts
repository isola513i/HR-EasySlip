"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import type { WeekdayKey } from "@/lib/attendance/constants";

export interface WeeklyDay {
  day: WeekdayKey;
  present: number;
  late: number;
  absent: number;
}

export function useAttendanceWeekly(weekStart: string) {
  const [data, setData] = useState<WeeklyDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<WeeklyDay[]>(
        `/api/v1/hr/attendance/weekly?weekStart=${weekStart}`,
      );
      setData(result);
    } catch (err) {
      setData([]);
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
