"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

export type NotificationKind =
  | "PAYROLL_CUTOFF_T3"
  | "PAYROLL_CUTOFF_T1"
  | "PAYROLL_CUTOFF_DDAY";

export interface PayrollCutoffMeta {
  cycleId: string;
  cutoffDateLabel: string;
  monthLabel: string;
  pendingOt: number;
  pendingLeave: number;
  pendingExpense: number;
  missingSalary: number;
}

export interface Notification {
  id: string;
  kind: NotificationKind;
  meta: PayrollCutoffMeta | Record<string, unknown> | null;
  refId: string | null;
  /** Pre-rendered fallbacks; new notifications render via dictionary + meta. */
  title: string | null;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface Response {
  items: Notification[];
  unreadCount: number;
}

export function useNotifications(open: boolean) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Response>("/api/v1/notifications?limit=8");
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    if (typeof window === "undefined") return;
    const id = window.setInterval(refetch, 60_000);
    return () => window.clearInterval(id);
  }, [refetch]);

  // Refetch when the popover opens, so the user sees fresh state.
  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  const markOne = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiFetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      refetch();
    }
  }, [refetch]);

  const markAll = useCallback(async () => {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    setUnreadCount(0);
    try {
      await apiFetch("/api/v1/notifications/mark-all-read", { method: "POST" });
    } catch {
      refetch();
    }
  }, [unreadCount, refetch]);

  return { items, unreadCount, loading, markOne, markAll };
}
