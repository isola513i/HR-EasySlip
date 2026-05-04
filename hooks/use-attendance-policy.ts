"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export interface AttendancePolicyResponse {
  shiftStart: { h: number; m: number };
  lateAfter: { h: number; m: number };
  lateThresholdMinutes: number;
  gpsCaptureEnabled: boolean;
  halfday: {
    morningStart: string;
    morningEnd: string;
    afternoonStart: string;
    afternoonEnd: string;
  };
}

const FALLBACK: AttendancePolicyResponse = {
  shiftStart: { h: 9, m: 0 },
  lateAfter: { h: 9, m: 15 },
  lateThresholdMinutes: 15,
  gpsCaptureEnabled: true,
  halfday: {
    morningStart: "09:00",
    morningEnd: "13:00",
    afternoonStart: "13:00",
    afternoonEnd: "18:00",
  },
};

export function useAttendancePolicy() {
  const [policy, setPolicy] = useState<AttendancePolicyResponse>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<AttendancePolicyResponse>("/api/v1/attendance/policy")
      .then((p) => { if (!cancelled) setPolicy(p); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { policy, loading };
}
