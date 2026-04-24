"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export interface LeaveCalendarEntry {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  halfDay: boolean;
  daysRequested: number;
  status: string;
  employee: {
    id: string;
    firstNameTh: string;
    lastNameTh: string;
    employeeCode: string;
  };
}

export function useLeaveCalendar(initialMonth?: number, initialYear?: number) {
  const now = new Date();
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [entries, setEntries] = useState<LeaveCalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (m: number, y: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<LeaveCalendarEntry[]>(
        `/api/v1/leave/team/calendar?month=${m}&year=${y}`,
      );
      setEntries(data);
    } catch (err) {
      setEntries([]);
      setError(err instanceof Error ? err.message : "Failed to load leave calendar");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(month, year); }, [month, year, fetchEntries]);

  return { entries, isLoading, error, month, setMonth, year, setYear };
}
