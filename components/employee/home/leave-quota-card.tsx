"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveQuota } from "@/hooks/use-leave-quota";
import { bangkokYear } from "@/lib/datetime/bangkok";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const LEAVE_PALETTE: Record<string, { track: string; fill: string }> = {
  SICK:             { track: "var(--es-success-100)",  fill: "var(--es-success-500)" },
  PERSONAL:         { track: "var(--es-warn-100)",     fill: "var(--es-warn-500)" },
  ANNUAL:           { track: "var(--es-accent-100)",   fill: "var(--es-accent-600)" },
  LEAVE_WITHOUT_PAY: { track: "var(--es-neutral-100)", fill: "var(--es-neutral-400)" },
  MATERNITY:        { track: "var(--es-error-100)",    fill: "var(--es-error-500)" },
  PATERNITY:        { track: "var(--es-info-100)",     fill: "var(--es-info-500)" },
};

const FALLBACK_PALETTE = { track: "var(--es-neutral-100)", fill: "var(--es-neutral-400)" };

interface LeaveQuotaCardProps {
  dict: Dictionary;
}

export function LeaveQuotaCard({ dict }: LeaveQuotaCardProps) {
  const { items, isLoading, error, refetch } = useLeaveQuota();

  const LEAVE_TYPE_LABEL: Record<string, string> = {
    SICK:              dict.leave.sick,
    PERSONAL:          dict.leave.personal,
    ANNUAL:            dict.leave.annual,
    LEAVE_WITHOUT_PAY: dict.leave.lwp,
    MATERNITY:         dict.leave.maternity,
    PATERNITY:         dict.leave.paternity,
    CHILD_CARE:        dict.leave.childCare,
    ORDINATION:        dict.leave.ordination,
    MILITARY:          dict.leave.military,
    FUNERAL:           dict.leave.funeral,
    TRAINING:          dict.leave.training,
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-(--es-neutral-100) px-4 py-3.5">
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={i < 2 ? "border-b border-(--es-neutral-100) px-4 py-3" : "px-4 py-3"}>
            <Skeleton className="mb-1.5 h-4 w-full" />
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-(--es-neutral-100) px-4 py-3.5">
          <div className="text-sm font-semibold">{dict.employee.leaveQuota}</div>
        </div>
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">{dict.common.loadFailed}</p>
          <button
            onClick={refetch}
            className="text-xs font-medium text-(--es-accent-600) hover:underline"
          >
            {dict.common.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/employee/leave"
      className="block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-(--es-neutral-300)"
    >
      <div className="flex items-center justify-between border-b border-(--es-neutral-100) px-4 py-3.5">
        <div>
          <div className="text-sm font-semibold">{dict.employee.leaveQuota}</div>
          <div className="text-[11px] text-muted-foreground">FY {bangkokYear()}</div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
      {items && items.length > 0 ? (
        items.map((q, i) => {
          const allocated = Number.isFinite(Number(q.allocatedDays)) ? Number(q.allocatedDays) : 0;
          const used = Number.isFinite(Number(q.usedDays)) ? Number(q.usedDays) : 0;
          const avail = Number.isFinite(Number(q.available)) ? Number(q.available) : 0;
          const pct = allocated > 0 ? (used / allocated) * 100 : 0;
          const palette = LEAVE_PALETTE[q.leaveType] ?? FALLBACK_PALETTE;
          const label = LEAVE_TYPE_LABEL[q.leaveType] ?? q.leaveType;
          return (
            <div key={q.leaveType} className={i < items.length - 1 ? "border-b border-(--es-neutral-100) px-4 py-3" : "px-4 py-3"}>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="font-medium">{label}</span>
                <span className="tabular-nums text-muted-foreground">
                  <b className="font-semibold text-foreground">{avail}</b> / {allocated} {dict.common.days}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={label}
                aria-valuenow={used}
                aria-valuemin={0}
                aria-valuemax={allocated}
                className="h-1 overflow-hidden rounded-full"
                style={{ backgroundColor: palette.track }}
              >
                <div
                  aria-hidden
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: palette.fill }}
                />
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
