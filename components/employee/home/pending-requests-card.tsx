"use client";

import Link from "next/link";
import { CalendarDays, Timer, Receipt, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingCounts } from "@/contexts/pending-counts-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface Props {
  dict: Dictionary;
}

interface PendingItem {
  key: "leave" | "ot" | "expense";
  icon: typeof CalendarDays;
  label: string;
  href: string;
  count: number;
}

export function PendingRequestsCard({ dict }: Props) {
  const e = dict.employee;
  const { counts, isLoading } = usePendingCounts();

  const total = counts ? counts.leave + counts.ot + counts.expense : 0;

  const items: PendingItem[] = counts
    ? [
        { key: "leave" as const, icon: CalendarDays, label: e.requestLeave, href: "/employee/leave", count: counts.leave },
        { key: "ot" as const, icon: Timer, label: e.requestOT, href: "/employee/ot", count: counts.ot },
        { key: "expense" as const, icon: Receipt, label: e.requestExpense, href: "/employee/expense", count: counts.expense },
      ].filter((it) => it.count > 0)
    : [];

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-[var(--es-neutral-100)] px-4 py-3">
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    );
  }

  if (total === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--es-warn-200)] bg-[var(--es-warn-50)]">
      <div className="flex items-center justify-between border-b border-[var(--es-warn-100)] px-4 py-3">
        <div className="text-sm font-semibold text-[var(--es-warn-800)]">{e.pendingTitle}</div>
        <span className="grid size-5 place-items-center rounded-full bg-[var(--es-warn-500)] text-[10px] font-bold text-white">
          {total}
        </span>
      </div>
      <ul aria-label={e.pendingTitle}>
        {items.map((it, i) => (
          <li key={it.key} className={i < items.length - 1 ? "border-b border-[var(--es-warn-100)]" : ""}>
            <Link
              href={it.href}
              aria-label={`${it.label} — ${it.count}`}
              className="flex items-center justify-between px-4 py-3 transition-colors active:bg-[var(--es-warn-100)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-[var(--es-warn-100)]">
                  <it.icon className="size-4 text-[var(--es-warn-700)]" strokeWidth={2} />
                </span>
                <span className="text-[13px] font-medium text-[var(--es-warn-900)]">{it.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold tabular-nums text-[var(--es-warn-700)]">{it.count}</span>
                <ChevronRight className="size-4 text-[var(--es-warn-400)]" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
