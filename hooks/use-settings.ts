"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export type SettingValue = string | number | boolean;
export type SettingGroup = "leave" | "payroll" | "attendance" | "geofence" | "overtime" | "pdpa";
export type SettingInputType =
  | "number"
  | "text"
  | "boolean"
  | "time"
  | "decimal"
  | "string-version";

export interface SystemSetting {
  key: string;
  value: SettingValue;
  defaultValue: SettingValue;
  description: string | null;
  group: SettingGroup;
  inputType: SettingInputType;
  unitKey: string | null;
  order: number;
  min: number | null;
  max: number | null;
  step: number | null;
  updatedBy: string | null;
  updatedAt: string | null;
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

  const updateOne = useCallback(
    async (key: string, value: SettingValue) => {
      await apiFetch("/api/v1/settings", {
        method: "PUT",
        body: JSON.stringify({ key, value }),
      });
      await fetchSettings();
    },
    [fetchSettings],
  );

  const updateBatch = useCallback(
    async (updates: Array<{ key: string; value: SettingValue }>) => {
      if (updates.length === 0) return;
      await apiFetch("/api/v1/settings", {
        method: "PATCH",
        body: JSON.stringify({ updates }),
      });
      await fetchSettings();
    },
    [fetchSettings],
  );

  const reset = useCallback(
    async (key: string) => {
      await apiFetch("/api/v1/settings/reset", {
        method: "POST",
        body: JSON.stringify({ key }),
      });
      await fetchSettings();
    },
    [fetchSettings],
  );

  return {
    settings,
    isLoading,
    error,
    updateOne,
    updateBatch,
    reset,
    refetch: fetchSettings,
  };
}
