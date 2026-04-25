"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Timer,
  CalendarDays,
  FileText,
  MapPin,
  Bell,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { getActionLabel } from "@/lib/audit/action-labels";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface Props {
  user: { name: string; code: string; role: string };
  dict: Dictionary;
}

interface LeaveQuotaItem {
  leaveType: string;
  allocatedDays: number;
  usedDays: number;
  available: number;
}

interface AuditEntry {
  action: string;
  createdAt: string;
  entityType: string;
}

const LEAVE_COLOR: Record<string, string> = {
  SICK: "var(--es-success-500)",
  PERSONAL: "var(--es-warn-500)",
  ANNUAL: "var(--es-accent-600)",
};

function formatClockTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function ClockDisplay() {
  const [time, setTime] = useState(() => formatClockTime(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(formatClockTime(new Date())), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums text-[40px] font-bold leading-[48px] tracking-tight">
      {time}
    </span>
  );
}

function LeaveQuotaSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="flex items-center justify-between border-b border-[var(--es-neutral-100)] px-4 py-3.5">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-1 h-3 w-16" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={i < 2 ? "border-b border-[var(--es-neutral-100)] px-4 py-3" : "px-4 py-3"}>
          <div className="mb-1.5 flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div>
      <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent</div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < 2 ? "border-b border-[var(--es-neutral-100)]" : ""}`}>
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatActionLabel(action: string) {
  return getActionLabel(action, "en");
}

export function EmployeeHome({ user, dict }: Props) {
  const [leaveQuota, setLeaveQuota] = useState<LeaveQuotaItem[] | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[] | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const ctrl = new AbortController();

    apiFetch<LeaveQuotaItem[]>("/api/v1/leave/quota/me", { signal: ctrl.signal })
      .then((d) => { if (!ignore) setLeaveQuota(d); })
      .catch(() => { if (!ignore) setLeaveQuota([]); })
      .finally(() => { if (!ignore) setQuotaLoading(false); });

    apiFetch<AuditEntry[]>("/api/v1/employee/me/activity?perPage=5", { signal: ctrl.signal })
      .then((d) => { if (!ignore) setRecentActivity(d); })
      .catch(() => { if (!ignore) setRecentActivity([]); })
      .finally(() => { if (!ignore) setActivityLoading(false); });

    return () => { ignore = true; ctrl.abort(); };
  }, []);

  return (
    <>
      {/* Topbar */}
      <header className="flex h-14 items-center justify-between border-b border-[var(--es-neutral-100)] px-4">
        <div>
          <div className="text-base font-semibold leading-5">
            {dict.common.greeting} {user.name || "User"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "EasySlip"} · {user.code} · {user.role}
          </div>
        </div>
        <Link
          href="/employee/inbox"
          className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted"
          aria-label="Inbox"
        >
          <Bell className="size-[22px]" strokeWidth={1.75} />
        </Link>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* Hero clock card */}
        <div className="flex flex-col gap-3.5 rounded-[20px] bg-[var(--es-neutral-900)] p-5 text-white shadow-[var(--es-shadow-md)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#aab3c0]">
                Today
              </div>
              <ClockDisplay />
            </div>
            <StatusPill
              tone="success"
              className="bg-[rgba(22,163,74,0.18)] text-[#86efac]"
            >
              <MapPin className="size-[11px]" /> GPS ready
            </StatusPill>
          </div>
          <Link
            href="/employee/clock"
            className="flex min-h-[72px] items-center justify-between rounded-2xl bg-[var(--es-accent-600)] px-5 py-[18px] text-[17px] font-bold text-white transition-colors hover:bg-[var(--es-accent-700)]"
          >
            <span className="flex items-center gap-3">
              <Clock className="size-6" strokeWidth={1.75} />
              Clock in
            </span>
            <ArrowRight className="size-5" />
          </Link>
          <div className="flex justify-between text-xs text-[#aab3c0]">
            <span>Shift starts 09:00</span>
            <span>Not clocked in yet</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2.5">
          <Link
            href="/employee/leave"
            className="rounded-xl border border-border bg-card p-3.5 shadow-[var(--es-shadow-sm)] transition-colors hover:bg-muted"
          >
            <CalendarDays className="size-[22px] text-[var(--es-accent-600)]" strokeWidth={1.75} />
            <div className="mt-2 text-sm font-semibold">Request leave</div>
            <div className="text-[11px] text-muted-foreground">Submit a leave request</div>
          </Link>
          <Link
            href="/employee/ot"
            className="rounded-xl border border-border bg-card p-3.5 shadow-[var(--es-shadow-sm)] transition-colors hover:bg-muted"
          >
            <Timer className="size-[22px] text-[var(--es-accent-600)]" strokeWidth={1.75} />
            <div className="mt-2 text-sm font-semibold">ขอ OT</div>
            <div className="text-[11px] text-muted-foreground">ส่งคำขอล่วงเวลา</div>
          </Link>
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-[var(--es-shadow-sm)]">
            <FileText className="size-[22px] text-[var(--es-accent-600)]" strokeWidth={1.75} />
            <div className="mt-2 text-sm font-semibold">Timesheet</div>
            <div className="text-[11px] text-muted-foreground">View attendance log</div>
          </div>
        </div>

        {/* Leave quota */}
        {quotaLoading ? (
          <LeaveQuotaSkeleton />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
            <div className="flex items-center justify-between border-b border-[var(--es-neutral-100)] px-4 py-3.5">
              <div>
                <div className="text-sm font-semibold">Leave quota</div>
                <div className="text-[11px] text-muted-foreground">FY {new Date().getFullYear()}</div>
              </div>
              <ChevronRight className="size-[18px] text-muted-foreground" />
            </div>
            {leaveQuota && leaveQuota.length > 0 ? (
              leaveQuota.map((q, i) => {
                const allocated = Number(q.allocatedDays);
                const used = Number(q.usedDays);
                const avail = Number(q.available);
                const pct = allocated > 0 ? (used / allocated) * 100 : 0;
                const color = LEAVE_COLOR[q.leaveType] ?? "var(--es-neutral-400)";
                return (
                  <div key={q.leaveType} className={i < leaveQuota.length - 1 ? "border-b border-[var(--es-neutral-100)] px-4 py-3" : "px-4 py-3"}>
                    <div className="mb-1.5 flex justify-between text-[13px]">
                      <span className="font-medium capitalize">{q.leaveType.toLowerCase()}</span>
                      <span className="tabular-nums text-muted-foreground">
                        <b className="font-semibold text-foreground">{avail}</b> / {allocated} days
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--es-neutral-100)]">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No leave quota found</div>
            )}
          </div>
        )}

        {/* Recent activity */}
        {activityLoading ? (
          <RecentActivitySkeleton />
        ) : (
          <div>
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent</div>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((r, i) => (
                  <div key={`${r.createdAt}-${i}`} className={`flex items-center justify-between px-4 py-3 ${i < recentActivity.length - 1 ? "border-b border-[var(--es-neutral-100)]" : ""}`}>
                    <div>
                      <div className="text-[13px] font-medium">{formatActionLabel(r.action)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</div>
                    </div>
                    <StatusPill tone="neutral">{r.entityType}</StatusPill>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No recent activity</div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
