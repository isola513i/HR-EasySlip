"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export type SalaryAdjustmentType =
  | "INITIAL"
  | "RAISE"
  | "DEMOTION"
  | "PROMOTION"
  | "CORRECTION"
  | "BONUS_GRANT";

export interface SalaryAdjustment {
  id: string;
  employeeId: string;
  effectiveDate: string;
  adjustmentType: SalaryAdjustmentType;
  salaryBefore: string | null;
  salaryAfter: string;
  ratePct: string | null;
  note: string | null;
  actorId: string;
  actorName: string;
  createdAt: string;
}

export type HistoryFilter = "salary" | "bonus";

export function useSalaryHistory(employeeId: string | null, filter: HistoryFilter) {
  const [items, setItems] = useState<SalaryAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    try {
      const data = await apiFetch<SalaryAdjustment[]>(
        `/api/v1/hr/employees/${employeeId}/salary-history?type=${filter}`,
      );
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, filter]);

  useEffect(() => { refetch(); }, [refetch]);

  return { items, isLoading, error, refetch };
}
