"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Clock,
  FileText,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetchPaginated } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/client";
import { formatLeaveType } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import { ACTION_LABELS_TH } from "@/lib/audit/action-labels";
import { useT } from "@/lib/i18n/locale-context";

/* ── Types ───────────────────────────────────────────────────── */

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  actor?: { id: string; email: string };
}

type Tone = "success" | "info" | "warn" | "neutral";

interface Notification {
  tone: Tone;
  icon: typeof Check;
  title: string;
  sub: string;
  time: string;
}

/* ── Action → tone / icon mapping ──────────────────────────── */

const ACTION_TONE_ICON: Record<
  string,
  { tone: Tone; icon: typeof Check }
> = {
  "leave.submit": { tone: "info", icon: FileText },
  "leave.approve": { tone: "success", icon: Check },
  "leave.reject": { tone: "warn", icon: AlertTriangle },
  "attendance.clock_in": { tone: "success", icon: Clock },
  "attendance.clock_out": { tone: "info", icon: Clock },
  "overtime.submit": { tone: "info", icon: FileText },
  "consent.grant": { tone: "neutral", icon: ShieldCheck },
};

function mapAuditToNotification(entry: AuditLogEntry): Notification {
  const mapping = ACTION_TONE_ICON[entry.action];
  const title = ACTION_LABELS_TH[entry.action] ?? entry.action;
  const tone = mapping?.tone ?? "neutral";
  const icon = mapping?.icon ?? Bell;

  // Build subtitle from entityType + entityId
  const entityLabel = entry.entityType.includes("leave")
    ? formatLeaveType(entry.entityType)
    : entry.entityType;
  const sub = `${entityLabel} · ${entry.entityId.slice(0, 8)}`;

  // Relative time
  const time = formatRelativeTime(entry.createdAt);

  return { tone, icon, title, sub, time };
}

/* ── Tone colours ────────────────────────────────────────────── */

const toneColors = {
  success: {
    bg: "bg-[var(--es-success-50)]",
    fg: "text-[var(--es-success-600)]",
  },
  info: { bg: "bg-[var(--es-info-50)]", fg: "text-[var(--es-info-600)]" },
  warn: { bg: "bg-[var(--es-warn-50)]", fg: "text-[var(--es-warn-600)]" },
  neutral: {
    bg: "bg-[var(--es-neutral-100)]",
    fg: "text-[var(--es-neutral-700)]",
  },
};

/* ── Component ───────────────────────────────────────────────── */

export function InboxScreen() {
  const t = useT();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await apiFetchPaginated<AuditLogEntry>(
          "/api/v1/employee/me/activity?perPage=10",
        );
        if (!cancelled) {
          setNotifications(data.map(mapAuditToNotification));
        }
      } catch (err) {
        // 403 = employee has no audit access → show empty state
        if (err instanceof ApiClientError && err.status === 403) {
          if (!cancelled) setNotifications([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <header className="flex h-14 items-center border-b border-[var(--es-neutral-100)] px-4">
        <span className="text-base font-semibold">{t.employee.inbox}</span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {loading && <InboxSkeleton />}

        {!loading && notifications.length === 0 && <InboxEmpty />}

        {!loading &&
          notifications.map((n, i) => {
            const tc = toneColors[n.tone];
            return (
              <div
                key={i}
                className="flex gap-3 rounded-xl border border-border bg-card p-3.5 shadow-[var(--es-shadow-sm)]"
              >
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${tc.bg} ${tc.fg}`}
                >
                  <n.icon className="size-[18px]" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {n.sub}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--es-neutral-500)]">
                    {n.time}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}

/* ── Loading skeleton ────────────────────────────────────────── */

function InboxSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-xl border border-border bg-card p-3.5"
        >
          <Skeleton className="size-9 shrink-0 rounded-[10px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Empty state ─────────────────────────────────────────────── */

function InboxEmpty() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
      <Bell className="size-10 opacity-40" strokeWidth={1.5} />
      <span className="text-sm">{t.employee.noNotifications}</span>
    </div>
  );
}
