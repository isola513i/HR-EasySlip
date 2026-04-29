"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import type { AttendanceStatus } from "@/lib/attendance/constants";

export interface TodayAttendanceRow {
  employeeId: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  departmentId: string | null;
  departmentName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  workingMinutes: number | null;
  status: AttendanceStatus;
}

export function useAttendanceToday(date: string) {
  const [rows, setRows] = useState<TodayAttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<TodayAttendanceRow[]>(
        `/api/v1/hr/attendance/today?date=${date}`,
      );
      setRows(result);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { rows, isLoading, error, refetch: fetchData };
}
