"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

type LeaveType = "SICK" | "PERSONAL" | "ANNUAL" | "LEAVE_WITHOUT_PAY";
type HalfDay = "FULL" | "MORNING" | "AFTERNOON";

export interface QuotaInfo {
  leaveType: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  available: number;
}

interface PreviewResult {
  days: number;
  available: number | null;
  sufficient: boolean;
}

export function useLeaveForm() {
  const [leaveType, setLeaveType] = useState<LeaveType>("SICK");
  const [halfDay, setHalfDay] = useState<HalfDay>("FULL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [quotas, setQuotas] = useState<QuotaInfo[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuotas, setIsLoadingQuotas] = useState(true);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  // Fetch quotas on mount
  useEffect(() => {
    apiFetch<QuotaInfo[]>("/api/v1/leave/quota/me")
      .then(setQuotas)
      .catch((err) => setQuotaError(err instanceof Error ? err.message : "Failed to load quotas"))
      .finally(() => setIsLoadingQuotas(false));
  }, []);

  // Preview when inputs change (debounced 300ms)
  useEffect(() => {
    if (!startDate || !endDate) { setPreview(null); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      apiFetch<PreviewResult>("/api/v1/leave/preview", {
        method: "POST",
        body: JSON.stringify({ leaveType, startDate, endDate, halfDay }),
        signal: ctrl.signal,
      })
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [leaveType, startDate, endDate, halfDay]);

  const submit = useCallback(async () => {
    if (!startDate || !endDate || !reason.trim()) return null;
    setIsSubmitting(true);
    try {
      const result = await apiFetch<{ id: string }>("/api/v1/leave/requests", {
        method: "POST",
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          halfDay,
          reason: reason.trim(),
        }),
      });
      return result;
    } finally {
      setIsSubmitting(false);
    }
  }, [leaveType, startDate, endDate, halfDay, reason]);

  const getBalance = useCallback(
    (type: string) => {
      const q = quotas.find((q) => q.leaveType === type);
      if (!q) return type === "LEAVE_WITHOUT_PAY" ? "∞" : "—";
      return `${q.available} / ${q.allocatedDays}`;
    },
    [quotas],
  );

  return {
    leaveType, setLeaveType, halfDay, setHalfDay,
    startDate, setStartDate, endDate, setEndDate,
    reason, setReason, quotas, preview, isSubmitting,
    isLoadingQuotas, quotaError, submit, getBalance,
  };
}
