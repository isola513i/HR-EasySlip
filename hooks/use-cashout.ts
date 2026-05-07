"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export type CashoutStatus = "PENDING" | "EXPORTED";
export type CashoutTrigger = "YEAR_END" | "RESIGNATION" | "TERMINATION";

export interface CashoutRecord {
  id: string;
  year: number;
  unusedDays: string;
  trigger: CashoutTrigger;
  exportStatus: CashoutStatus;
  exportedAt: string | null;
  computedAt: string;
  employee: {
    firstNameTh: string;
    lastNameTh: string;
    employeeCode: string;
  };
}

export function useCashout(initialYear?: number) {
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear());
  const [items, setItems] = useState<CashoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (y: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CashoutRecord[]>(`/api/v1/payroll/cashout/${y}`);
      setItems(data);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Failed to load cashouts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(year); }, [year, fetchItems]);

  const markExported = useCallback(
    async (id: string) => {
      await apiFetch(`/api/v1/payroll/cashout/${year}/record/${id}/mark-exported`, { method: "POST" });
      await fetchItems(year);
    },
    [year, fetchItems],
  );

  const downloadCsv = useCallback(async () => {
    const res = await fetch(`/api/v1/payroll/cashout/${year}/export`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to download cashout report");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashout-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [year]);

  return { items, isLoading, error, year, setYear, markExported, downloadCsv };
}
