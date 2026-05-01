"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { PdpaOverview } from "@/lib/consent/pdpa-overview-service";

export function usePdpaOverview() {
  const [data, setData] = useState<PdpaOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<PdpaOverview>("/api/v1/hr/pdpa/overview");
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load PDPA overview");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
