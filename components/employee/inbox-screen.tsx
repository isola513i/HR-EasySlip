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

/* ── Action → label / tone / icon mapping ───────────────────── */

const ACTION_MAP: Record<
  string,
  { label: string; tone: Tone; icon: typeof Check }
> = {
  "leave.submit": { label: "ส่งคำขอลา", tone: "info", icon: FileText },
  "leave.approve": { label: "คำขอลาอนุมัติแล้ว", tone: "success", icon: Check },
  "leave.reject": { label: "คำขอลาถูกปฏิเสธ", tone: "warn", icon: AlertTriangle },
  "attendance.clock_in": { label: "ลงเวลาเข้างาน", tone: "success", icon: Clock },
  "attendance.clock_out": { label: "ลงเวลาออกงาน", tone: "info", icon: Clock },
  "overtime.submit": { label: "ส่งคำขอ OT", tone: "info", icon: FileText },
  "consent.grant": { label: "ยินยอม PDPA", tone: "neutral", icon: ShieldCheck },
};

function mapAuditToNotification(entry: AuditLogEntry): Notification {
  const mapping = ACTION_MAP[entry.action];
  const title = mapping?.label ?? entry.action;
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

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "เมื่อวาน";
  return `${days} วันที่แล้ว`;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await apiFetchPaginated<AuditLogEntry>(
          "/api/v1/audit/logs?perPage=10",
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
        <span className="text-base font-semibold">Inbox</span>
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
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
      <Bell className="size-10 opacity-40" strokeWidth={1.5} />
      <span className="text-sm">ไม่มีการแจ้งเตือน</span>
    </div>
  );
}
