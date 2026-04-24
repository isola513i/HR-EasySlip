"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export interface AttendanceRecord {
  id: string;
  clockType: "IN" | "OUT";
  clockedAt: string;
  workLocation: string;
  employee: {
    id: string;
    firstNameTh: string;
    lastNameTh: string;
    employeeCode: string;
  };
}

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function useAttendanceTeam(initialDate?: string) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async (d: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AttendanceRecord[]>(
        `/api/v1/attendance/team?date=${d}`,
      );
      setRecords(data);
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : "Failed to load attendance");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(date); }, [date, fetchRecords]);

  return { records, isLoading, error, date, setDate };
}
