"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

type ClockState = "loading" | "idle" | "clocking" | "done" | "error";
export type LocationType = "OFFICE" | "WFH" | "ON_SITE";
type ClockType = "IN" | "OUT";

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface AttendanceRecord {
  id: string;
  clockType: ClockType;
  clockedAt: string;
}

export function useClock() {
  const [clockState, setClockState] = useState<ClockState>("loading");
  const [clockType, setClockType] = useState<ClockType>("IN");
  const [location, setLocation] = useState<LocationType>("OFFICE");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"loading" | "ready" | "denied">("loading");
  const [clockedTime, setClockedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch GPS + today's records on mount
  useEffect(() => {
    let ignore = false;
    const ctrl = new AbortController();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (ignore) return;
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsStatus("ready");
      },
      () => { if (!ignore) setGpsStatus("denied"); },
      { enableHighAccuracy: true, timeout: 10000 },
    );

    const today = new Date().toLocaleDateString("sv-SE");
    apiFetch<AttendanceRecord[]>(`/api/v1/attendance/me?from=${today}&to=${today}`, { signal: ctrl.signal })
      .then((records) => {
        if (ignore) return;
        const last = records.at(-1);
        setClockType(last?.clockType === "IN" ? "OUT" : "IN");
        setClockState("idle");
      })
      .catch(() => { if (!ignore) setClockState("idle"); });

    return () => { ignore = true; ctrl.abort(); };
  }, []);

  const handleClock = useCallback(async () => {
    if (clockState !== "idle") return;
    setClockState("clocking");
    setError(null);

    try {
      const record = await apiFetch<AttendanceRecord>(
        "/api/v1/attendance/clock",
        {
          method: "POST",
          body: JSON.stringify({
            clockType,
            workLocation: location,
            ...(coords && {
              latitude: coords.latitude,
              longitude: coords.longitude,
              gpsAccuracyM: coords.accuracy,
            }),
          }),
        },
      );

      const time = new Date(record.clockedAt);
      setClockedTime(
        `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`,
      );
      setClockState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clock failed");
      setClockState("error");
    }
  }, [clockState, clockType, location, coords]);

  const reset = useCallback(() => {
    setClockType((prev) => (prev === "IN" ? "OUT" : "IN"));
    setClockedTime(null);
    setError(null);
    setClockState("idle");
  }, []);

  return {
    clockState, clockType, location, setLocation,
    coords, gpsStatus, clockedTime, error, handleClock, reset,
  };
}
