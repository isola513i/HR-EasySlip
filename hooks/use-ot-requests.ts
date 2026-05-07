"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";

export type OTType = "WEEKDAY" | "HOLIDAY" | "HOLIDAY_WORK";

export function useOTRequests() {
  const [otType, setOTType] = useState<OTType>("WEEKDAY");
  const [date, setDate] = useState("");
  const [assignedStart, setAssignedStart] = useState("");
  const [assignedEnd, setAssignedEnd] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!date || !reason.trim()) return null;
    if (otType !== "WEEKDAY" && (!assignedStart || !assignedEnd)) return null;

    setIsSubmitting(true);
    setError(null);
    try {
      const body =
        otType === "WEEKDAY"
          ? { date, reason: reason.trim() }
          : { date, assignedStart, assignedEnd, reason: reason.trim(), kind: otType };

      const result = await apiFetch<{ id: string }>(
        "/api/v1/overtime/requests",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [otType, date, assignedStart, assignedEnd, reason]);

  return {
    otType, setOTType,
    date, setDate,
    assignedStart, setAssignedStart,
    assignedEnd, setAssignedEnd,
    reason, setReason,
    isSubmitting, error,
    submit,
  };
}
