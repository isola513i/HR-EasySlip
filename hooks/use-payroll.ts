"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export type PayrollCycleStatus = "OPEN" | "LOCKED" | "EXPORTED";

export const PAYROLL_STATUS_TONE: Record<PayrollCycleStatus, "info" | "warn" | "success"> = {
  OPEN: "info",
  LOCKED: "warn",
  EXPORTED: "success",
};

export interface PayrollCycle {
  id: string;
  year: number;
  month: number;
  cycleStart: string;
  cycleEnd: string;
  status: PayrollCycleStatus;
  lockedAt: string | null;
}

export function usePayroll(initialYear?: number) {
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear());
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCycles = useCallback(async (y: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PayrollCycle[]>(
        `/api/v1/payroll/cycles?year=${y}`,
      );
      setCycles(data);
    } catch (err) {
      setCycles([]);
      setError(
        err instanceof Error ? err.message : "Failed to load payroll cycles",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycles(year);
  }, [year, fetchCycles]);

  const lockCycle = useCallback(
    async (id: string) => {
      await apiFetch(`/api/v1/payroll/cycles/${id}/lock`, { method: "POST" });
      await fetchCycles(year);
    },
    [year, fetchCycles],
  );

  const markExported = useCallback(
    async (id: string) => {
      await apiFetch(`/api/v1/payroll/cycles/${id}/mark-exported`, { method: "POST" });
      await fetchCycles(year);
    },
    [year, fetchCycles],
  );

  const downloadTimestamps = useCallback(async (id: string) => {
    const res = await fetch(`/api/v1/payroll/cycles/${id}/export/timestamps`);
    if (!res.ok) throw new Error("Failed to download timestamps");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timestamps-${id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadCashout = useCallback(async (y: number) => {
    const res = await fetch(`/api/v1/payroll/cashout/${y}/export`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to download cashout report");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashout-${y}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadPayrollInfo = useCallback(async (id: string) => {
    const res = await fetch(`/api/v1/payroll/cycles/${id}/export/payroll-info`);
    if (!res.ok) throw new Error("Failed to download payroll info");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-info-${id}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadEmployeeData = useCallback(async () => {
    const res = await fetch("/api/v1/payroll/employees/export");
    if (!res.ok) throw new Error("Failed to download employee data");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-data.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    cycles, isLoading, error, year, setYear,
    lockCycle, markExported, downloadTimestamps, downloadCashout,
    downloadPayrollInfo, downloadEmployeeData,
  };
}
