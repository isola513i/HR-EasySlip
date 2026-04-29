"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import type { UpcomingEvent } from "@/lib/hr/upcoming-events-service";

export function useUpcomingEvents() {
  const [data, setData] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await apiFetch<UpcomingEvent[]>("/api/v1/hr/dashboard/upcoming-events");
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
