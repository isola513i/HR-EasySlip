"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { bangkokTodayKey } from "@/lib/datetime/bangkok";

export interface TimesheetEntry {
  date: string;
  firstIn: string | null;
  lastOut: string | null;
  workedMinutes: number;
  lateMinutes: number;
  workLocation: "OFFICE" | "WFH" | "ON_SITE" | null;
  hasBackfill: boolean;
  recordCount: number;
}

export interface TimesheetSummary {
  totalDays: number;
  workedMinutes: number;
  lateDays: number;
  averageMinutesPerDay: number;
}

export type TimesheetRange = "7d" | "30d" | "thisMonth" | "lastMonth" | "custom";

function bangkokDateUtc(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd}T00:00:00.000Z`);
}

function shiftIsoDays(yyyymmdd: string, deltaDays: number): string {
  const d = bangkokDateUtc(yyyymmdd);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function rangeToDates(range: TimesheetRange, custom?: { from: string; to: string }) {
  const todayKey = bangkokTodayKey();

  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 6 : 29;
    return { from: shiftIsoDays(todayKey, -days), to: todayKey };
  }
  if (range === "thisMonth") {
    const todayBkk = bangkokDateUtc(todayKey);
    const first = new Date(Date.UTC(todayBkk.getUTCFullYear(), todayBkk.getUTCMonth(), 1));
    return { from: first.toISOString().slice(0, 10), to: todayKey };
  }
  if (range === "lastMonth") {
    const todayBkk = bangkokDateUtc(todayKey);
    const first = new Date(Date.UTC(todayBkk.getUTCFullYear(), todayBkk.getUTCMonth() - 1, 1));
    const last = new Date(Date.UTC(todayBkk.getUTCFullYear(), todayBkk.getUTCMonth(), 0));
    return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
  }
  return custom ?? { from: todayKey, to: todayKey };
}

export function useTimesheet() {
  const [range, setRange] = useState<TimesheetRange>("7d");
  const [custom, setCustom] = useState<{ from: string; to: string } | undefined>(undefined);
  const [data, setData] = useState<{ entries: TimesheetEntry[]; summary: TimesheetSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dates = rangeToDates(range, custom);
      const result = await apiFetch<{ entries: TimesheetEntry[]; summary: TimesheetSummary }>(
        `/api/v1/attendance/me/timesheet?from=${dates.from}&to=${dates.to}`,
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timesheet");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range, custom]);

  useEffect(() => { refetch(); }, [refetch]);

  return { range, setRange, custom, setCustom, data, loading, error, refetch, dates: rangeToDates(range, custom) };
}
