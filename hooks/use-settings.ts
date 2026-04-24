"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export interface SystemSetting {
  key: string;
  value: string | number | boolean;
  description: string | null;
  updatedBy: string;
  updatedAt: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SystemSetting[]>("/api/v1/settings");
      setSettings(data);
    } catch (err) {
      setSettings([]);
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const update = useCallback(
    async (key: string, value: string | number | boolean) => {
      await apiFetch("/api/v1/settings", {
        method: "PUT",
        body: JSON.stringify({ key, value }),
      });
      await fetchSettings();
    },
    [fetchSettings],
  );

  return { settings, isLoading, error, update, refetch: fetchSettings };
}
