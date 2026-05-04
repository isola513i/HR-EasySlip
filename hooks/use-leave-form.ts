"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import type { LeaveType as PrismaLeaveType, LeaveStatus } from "@prisma/client";

type LeaveType = "SICK" | "PERSONAL" | "ANNUAL" | "LEAVE_WITHOUT_PAY";
type HalfDay = "FULL" | "MORNING" | "AFTERNOON";

export interface QuotaInfo {
  leaveType: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  available: number;
}

export interface OverlapInfo {
  id: string;
  startDate: string;
  endDate: string;
  status: Extract<LeaveStatus, "PENDING" | "APPROVED">;
  leaveType: PrismaLeaveType;
}

interface PreviewResult {
  days: number;
  available: number | null;
  sufficient: boolean;
  overlap: OverlapInfo | null;
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
      const result = await apiFetch<{ request: { id: string }; overflow: { id: string } | null }>("/api/v1/leave/requests", {
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

  /** True when the leave type is restricted (e.g. ANNUAL during probation).
   * ANNUAL: ineligible when quota row is missing entirely (probation grant
   * hasn't run yet) OR when allocatedDays === 0. Other types remain
   * selectable even at 0 because the quota may legitimately exhaust
   * mid-year and the user still needs visibility. */
  const isTypeIneligible = useCallback(
    (type: LeaveType) => {
      if (type === "LEAVE_WITHOUT_PAY") return false;
      if (type !== "ANNUAL") return false;
      const q = quotas.find((qq) => qq.leaveType === type);
      return q === undefined || q.allocatedDays === 0;
    },
    [quotas],
  );

  return {
    leaveType, setLeaveType, halfDay, setHalfDay,
    startDate, setStartDate, endDate, setEndDate,
    reason, setReason, quotas, preview, isSubmitting,
    isLoadingQuotas, quotaError, submit, getBalance, isTypeIneligible,
  };
}
