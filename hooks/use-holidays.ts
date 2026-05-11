"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export type HolidayColor = "red" | "orange" | "amber" | "green" | "blue";

export interface Holiday {
  id: string;
  year: number;
  date: string;
  name: string;
  nameEn: string | null;
  isSubstituted: boolean;
  color: HolidayColor;
}

export function useHolidays(initialYear?: number) {
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (y: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Holiday[]>(`/api/v1/hr/holidays?year=${y}`);
      setHolidays(data);
    } catch (err) {
      setHolidays([]);
      setError(err instanceof Error ? err.message : "Failed to load holidays");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(year); }, [year, fetch]);

  const create = useCallback(async (input: { date: string; name: string; nameEn?: string; isSubstituted?: boolean; color?: HolidayColor }) => {
    await apiFetch("/api/v1/hr/holidays", { method: "POST", body: JSON.stringify(input) });
    await fetch(year);
  }, [year, fetch]);

  const update = useCallback(async (id: string, input: { date?: string; name?: string; nameEn?: string; isSubstituted?: boolean; color?: HolidayColor }) => {
    await apiFetch(`/api/v1/hr/holidays/${id}`, { method: "PUT", body: JSON.stringify(input) });
    await fetch(year);
  }, [year, fetch]);

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/hr/holidays/${id}`, { method: "DELETE" });
    await fetch(year);
  }, [year, fetch]);

  return { holidays, isLoading, error, year, setYear, create, update, remove };
}
