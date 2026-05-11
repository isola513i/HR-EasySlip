"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { bangkokYear } from "@/lib/datetime/bangkok";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface LeaveQuotaItem {
  leaveType: string;
  allocatedDays: number;
  usedDays: number;
  available: number;
}

const LEAVE_PALETTE: Record<string, { track: string; fill: string }> = {
  SICK: { track: "var(--es-success-100)", fill: "var(--es-success-500)" },
  PERSONAL: { track: "var(--es-warn-100)", fill: "var(--es-warn-500)" },
  ANNUAL: { track: "var(--es-accent-100)", fill: "var(--es-accent-600)" },
  LEAVE_WITHOUT_PAY: { track: "var(--es-neutral-100)", fill: "var(--es-neutral-400)" },
  MATERNITY: { track: "var(--es-error-100)", fill: "var(--es-error-500)" },
  PATERNITY: { track: "var(--es-info-100)", fill: "var(--es-info-500)" },
};

const FALLBACK_PALETTE = { track: "var(--es-neutral-100)", fill: "var(--es-neutral-400)" };

interface LeaveQuotaCardProps {
  dict: Dictionary;
}

export function LeaveQuotaCard({ dict }: LeaveQuotaCardProps) {
  const [items, setItems] = useState<LeaveQuotaItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch<LeaveQuotaItem[]>("/api/v1/leave/quota/me", { signal: ctrl.signal })
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        if (ctrl.signal.aborted || (err as { name?: string })?.name === "AbortError") return;
        setItems([]);
        setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  const LEAVE_TYPE_LABEL: Record<string, string> = {
    SICK:             dict.leave.sick,
    PERSONAL:         dict.leave.personal,
    ANNUAL:           dict.leave.annual,
    LEAVE_WITHOUT_PAY: dict.leave.lwp,
    MATERNITY:        dict.leave.maternity,
    PATERNITY:        dict.leave.paternity,
    CHILD_CARE:       dict.leave.childCare,
    ORDINATION:       dict.leave.ordination,
    MILITARY:         dict.leave.military,
    FUNERAL:          dict.leave.funeral,
    TRAINING:         dict.leave.training,
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-[var(--es-neutral-100)] px-4 py-3.5">
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={i < 2 ? "border-b border-[var(--es-neutral-100)] px-4 py-3" : "px-4 py-3"}>
            <Skeleton className="mb-1.5 h-4 w-full" />
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Link
      href="/employee/leave"
      className="block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-[var(--es-neutral-300)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--es-neutral-100)] px-4 py-3.5">
        <div>
          <div className="text-sm font-semibold">{dict.employee.leaveQuota}</div>
          <div className="text-[11px] text-muted-foreground">FY {bangkokYear()}</div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
      {items && items.length > 0 ? (
        items.map((q, i) => {
          const allocated = Number(q.allocatedDays);
          const used = Number(q.usedDays);
          const avail = Number(q.available);
          const pct = allocated > 0 ? (used / allocated) * 100 : 0;
          const palette = LEAVE_PALETTE[q.leaveType] ?? FALLBACK_PALETTE;
          return (
            <div key={q.leaveType} className={i < items.length - 1 ? "border-b border-[var(--es-neutral-100)] px-4 py-3" : "px-4 py-3"}>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="font-medium">{LEAVE_TYPE_LABEL[q.leaveType] ?? q.leaveType}</span>
                <span className="tabular-nums text-muted-foreground">
                  <b className="font-semibold text-foreground">{avail}</b> / {allocated} {dict.common.days}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full" style={{ backgroundColor: palette.track }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: palette.fill }} />
              </div>
            </div>
          );
        })
      ) : (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">{dict.employee.noLeaveQuota}</div>
      )}
    </Link>
  );
}
