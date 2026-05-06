"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { bangkokTodayKey } from "@/lib/datetime/bangkok";

type ClockState = "loading" | "idle" | "in" | "out";

interface AttendanceRecord {
  id: string;
  clockType: "IN" | "OUT";
  clockedAt: string;
}

export interface ClockStatus {
  state: ClockState;
  /** HH:MM of the most recent IN record, if any */
  inTime: string | null;
  /** HH:MM of the most recent OUT record, if any */
  outTime: string | null;
  refetch: () => void;
}

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function useClockStatus(): ClockStatus {
  const [state, setState] = useState<ClockState>("loading");
  const [inTime, setInTime] = useState<string | null>(null);
  const [outTime, setOutTime] = useState<string | null>(null);

  const fetchStatus = useCallback(async (signal?: AbortSignal) => {
    setState("loading");
    try {
      const today = bangkokTodayKey();
      const records = await apiFetch<AttendanceRecord[]>(
        `/api/v1/attendance/me?from=${today}&to=${today}`,
        { signal },
      );
      if (records.length === 0) {
        setState("idle");
        setInTime(null);
        setOutTime(null);
        return;
      }
      let latestIn: AttendanceRecord | undefined;
      let latestOut: AttendanceRecord | undefined;
      for (let i = records.length - 1; i >= 0; i--) {
        const r = records[i];
        if (!latestIn && r.clockType === "IN") latestIn = r;
        if (!latestOut && r.clockType === "OUT") latestOut = r;
        if (latestIn && latestOut) break;
      }
      setInTime(latestIn ? formatHHMM(latestIn.clockedAt) : null);
      setOutTime(latestOut ? formatHHMM(latestOut.clockedAt) : null);
      setState(records[records.length - 1].clockType === "IN" ? "in" : "out");
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 0) return; // aborted
      if ((err as { name?: string })?.name === "AbortError") return;
      setState("idle");
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchStatus(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchStatus]);

  return { state, inTime, outTime, refetch: () => void fetchStatus() };
}
