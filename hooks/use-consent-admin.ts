"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetchPaginated } from "@/lib/api/client";
import type { AuditEntry } from "@/hooks/use-audit-logs";

export function useConsentAdmin() {
  const [events, setEvents] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetchPaginated<AuditEntry>(
        "/api/v1/audit/logs?action=consent&perPage=20",
      );
      setEvents(result.data);
    } catch (err) {
      setEvents([]);
      setError(err instanceof Error ? err.message : "Failed to load consent events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, error };
}
