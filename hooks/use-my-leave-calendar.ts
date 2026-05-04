"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export interface MyLeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  halfDay: "FULL" | "MORNING" | "AFTERNOON";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "WITHDRAWN";
  daysRequested: string;
  reason: string;
}

export interface PublicHoliday {
  id: string;
  date: string;
  nameTh: string;
  nameEn: string;
}

export function useMyLeaveCalendar() {
  const today = new Date();
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [year, setYear] = useState<number>(today.getFullYear());
  const [requests, setRequests] = useState<MyLeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ requests: MyLeaveRequest[]; holidays: PublicHoliday[] }>(
        `/api/v1/leave/me/calendar?month=${month}&year=${year}`,
      );
      setRequests(data.requests);
      setHolidays(data.holidays);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar");
      setRequests([]);
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => { refetch(); }, [refetch]);

  return { month, year, setMonth, setYear, requests, holidays, isLoading, error, refetch };
}
