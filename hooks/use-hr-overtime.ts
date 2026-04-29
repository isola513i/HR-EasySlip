"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiFetchPaginated } from "@/lib/api/client";

export interface HrOvertimeRow {
  id: string;
  date: string;
  overtimeType: "WEEKDAY" | "HOLIDAY" | "HOLIDAY_WORK";
  hoursApproved: string | null;
  rateMultiplier: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "WITHDRAWN";
  createdAt: string;
  approverId: string | null;
  employee: {
    firstNameTh: string;
    lastNameTh: string;
    employeeCode: string;
  };
  approver: {
    firstNameTh: string;
    lastNameTh: string;
  } | null;
}

interface Summary {
  totalRecords: number;
  totalHours: number;
}

export type OTStatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export function useHrOvertime() {
  const [rows, setRows] = useState<HrOvertimeRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalRecords: 0, totalHours: 0 });
  const [status, setStatus] = useState<OTStatusFilter>("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const listParams = new URLSearchParams({ perPage: "100" });
      const summaryParams = new URLSearchParams();
      if (status !== "ALL") {
        listParams.set("status", status);
        summaryParams.set("status", status);
      }
      const [list, sum] = await Promise.all([
        apiFetchPaginated<HrOvertimeRow>(`/api/v1/hr/overtime?${listParams}`),
        apiFetch<Summary>(`/api/v1/hr/overtime/summary?${summaryParams}`),
      ]);
      setRows(list.data);
      setSummary(sum);
    } catch (err) {
      setRows([]);
      setSummary({ totalRecords: 0, totalHours: 0 });
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const approve = useCallback(async (id: string) => {
    await apiFetch(`/api/v1/hr/overtime/${id}/approve`, { method: "POST" });
    await fetchData();
  }, [fetchData]);

  const reject = useCallback(async (id: string, reason: string) => {
    await apiFetch(`/api/v1/hr/overtime/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    await fetchData();
  }, [fetchData]);

  return { rows, summary, status, setStatus, isLoading, error, approve, reject, refetch: fetchData };
}
