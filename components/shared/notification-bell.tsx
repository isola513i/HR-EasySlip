"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Clock, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRelativeTime } from "@/lib/format";
import { useT } from "@/lib/i18n/locale-context";
import {
  useNotifications,
  type Notification,
  type NotificationKind,
  type PayrollCutoffMeta,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  /** Retained for API compatibility — notifications are now scoped server-side. */
  userId: string;
}

const KIND_ICON: Record<NotificationKind, typeof Calendar> = {
  PAYROLL_CUTOFF_T3: Calendar,
  PAYROLL_CUTOFF_T1: Clock,
  PAYROLL_CUTOFF_DDAY: AlertTriangle,
};

const KIND_TONE: Record<NotificationKind, string> = {
  PAYROLL_CUTOFF_T3: "text-[var(--es-accent-600)]",
  PAYROLL_CUTOFF_T1: "text-[var(--es-warn-600)]",
  PAYROLL_CUTOFF_DDAY: "text-[var(--es-error-500)]",
};

export function NotificationBell({ userId: _userId }: NotificationBellProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { items, unreadCount, loading, markOne, markAll } = useNotifications(open);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t.common.notifications}
        className="relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 active:transition-transform active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Bell className="size-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="pointer-events-none absolute right-1 top-1 grid place-items-center">
            <span aria-hidden="true" className="absolute inline-flex size-2.5 animate-ping rounded-full bg-[var(--es-error-500)] opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[var(--es-error-500)]" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(90vw,360px)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="text-sm font-semibold">{t.common.notifications}</div>
          <button
            type="button"
            onClick={markAll}
            disabled={unreadCount === 0}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              unreadCount === 0
                ? "cursor-not-allowed text-muted-foreground/50"
                : "text-[var(--es-accent-600)] hover:bg-[var(--es-accent-50)]",
            )}
          >
            {t.common.markAllAsRead}
          </button>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {loading && <div className="px-4 py-6 text-center text-xs text-muted-foreground">{t.common.loadingNotifications}</div>}
          {!loading && items.length === 0 && <div className="px-4 py-6 text-center text-xs text-muted-foreground">{t.common.noNotifications}</div>}
          {items.map((n) => (
            <NotificationRow key={n.id} item={n} onClick={() => markOne(n.id)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface RowProps {
  item: Notification;
  onClick: () => void;
}

function NotificationRow({ item, onClick }: RowProps) {
  const t = useT();
  const Icon = KIND_ICON[item.kind] ?? Bell;
  const tone = KIND_TONE[item.kind] ?? "text-muted-foreground";
  const isUnread = !item.readAt;
  const rendered = renderPayrollCutoff(item, t);
  const visibleTitle = rendered?.title ?? item.title ?? "";
  const visibleBody = rendered?.body ?? item.body ?? "";

  const inner = (
    <div className="flex w-full items-start gap-2.5">
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone)} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <div className={cn("text-[13px] leading-tight", isUnread ? "font-semibold" : "font-medium")}>
          {visibleTitle}
        </div>
        <div className="mt-0.5 line-clamp-2 whitespace-pre-line text-[11px] text-muted-foreground">
          {visibleBody}
        </div>
        <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">
          {formatRelativeTime(item.createdAt)}
        </div>
      </div>
      {isUnread && <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--es-accent-500)]" />}
    </div>
  );

  const className = cn(
    "group block w-full border-b border-[var(--es-neutral-100)] px-4 py-2.5 text-left transition-colors last:border-b-0",
    isUnread ? "bg-[var(--es-accent-50)]/40 hover:bg-[var(--es-accent-50)]" : "hover:bg-muted/60",
  );

  if (item.link) {
    return (
      <Link href={item.link} onClick={onClick} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

type Dict = ReturnType<typeof useT>;

const PAYROLL_KIND_KEY: Record<NotificationKind, "T3" | "T1" | "DDAY"> = {
  PAYROLL_CUTOFF_T3: "T3",
  PAYROLL_CUTOFF_T1: "T1",
  PAYROLL_CUTOFF_DDAY: "DDAY",
};

function renderPayrollCutoff(item: Notification, t: Dict): { title: string; body: string } | null {
  const key = PAYROLL_KIND_KEY[item.kind];
  if (!key || !item.meta) return null;
  const meta = item.meta as PayrollCutoffMeta;
  const dict = t.notifications.payrollCutoff;
  const line1 = dict.bodyLine1
    .replace("{month}", meta.monthLabel)
    .replace("{cutoff}", meta.cutoffDateLabel);
  const line2 = dict.bodyLine2
    .replace("{ot}", String(meta.pendingOt))
    .replace("{leave}", String(meta.pendingLeave))
    .replace("{expense}", String(meta.pendingExpense));
  const lines = [line1, line2];
  if (meta.missingSalary > 0) {
    lines.push(dict.bodySalaryWarn.replace("{count}", String(meta.missingSalary)));
  }
  return { title: dict[key].title, body: lines.join("\n") };
}
