"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CalendarDays,
  FileText,
  MapPin,
  Bell,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface Props {
  user: { name: string; code: string; role: string };
  dict: Dictionary;
}

const leaveQuota = [
  { label: "Sick", used: 2, total: 30, color: "var(--es-success-500)" },
  { label: "Personal", used: 1, total: 3, color: "var(--es-warn-500)" },
  { label: "Annual", used: 0, total: 4, color: "var(--es-accent-600)" },
];

const recentActivity = [
  { d: "Fri, Apr 18", t: "09:02 → 18:14", loc: "WFH", tone: "info" as const },
  { d: "Thu, Apr 17", t: "08:58 → 18:02", loc: "Office", tone: "neutral" as const },
  { d: "Wed, Apr 16", t: "Sick leave · 1 day", loc: "Sick", tone: "success" as const },
];

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function ClockDisplay() {
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums text-[40px] font-bold leading-[48px] tracking-tight">
      {time}
    </span>
  );
}

export function EmployeeHome({ user, dict }: Props) {
  return (
    <>
      {/* Topbar */}
      <header className="flex h-14 items-center justify-between border-b border-[var(--es-neutral-100)] px-4">
        <div>
          <div className="text-base font-semibold leading-5">
            {dict.common.greeting} {user.name || "User"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            EasySlip · {user.code} · {user.role}
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
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/employee/leave"
            className="rounded-xl border border-border bg-card p-3.5 shadow-[var(--es-shadow-sm)] transition-colors hover:bg-muted"
          >
            <CalendarDays className="size-[22px] text-[var(--es-accent-600)]" strokeWidth={1.75} />
            <div className="mt-2 text-sm font-semibold">Request leave</div>
            <div className="text-[11px] text-muted-foreground">Submit a leave request</div>
          </Link>
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-[var(--es-shadow-sm)]">
            <FileText className="size-[22px] text-[var(--es-accent-600)]" strokeWidth={1.75} />
            <div className="mt-2 text-sm font-semibold">Timesheet</div>
            <div className="text-[11px] text-muted-foreground">View attendance log</div>
          </div>
        </div>

        {/* Leave quota */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
          <div className="flex items-center justify-between border-b border-[var(--es-neutral-100)] px-4 py-3.5">
            <div>
              <div className="text-sm font-semibold">Leave quota</div>
              <div className="text-[11px] text-muted-foreground">FY 2026</div>
            </div>
            <ChevronRight className="size-[18px] text-muted-foreground" />
          </div>
          {leaveQuota.map((q, i) => (
            <div key={q.label} className={i < leaveQuota.length - 1 ? "border-b border-[var(--es-neutral-100)] px-4 py-3" : "px-4 py-3"}>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="font-medium">{q.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  <b className="font-semibold text-foreground">{q.total - q.used}</b> / {q.total} days
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--es-neutral-100)]">
                <div className="h-full rounded-full" style={{ width: `${(q.used / q.total) * 100}%`, backgroundColor: q.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div>
          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent</div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
            {recentActivity.map((r, i) => (
              <div key={r.d} className={`flex items-center justify-between px-4 py-3 ${i < recentActivity.length - 1 ? "border-b border-[var(--es-neutral-100)]" : ""}`}>
                <div>
                  <div className="text-[13px] font-medium">{r.d}</div>
                  <div className="tabular-nums text-xs text-muted-foreground">{r.t}</div>
                </div>
                <StatusPill tone={r.tone}>{r.loc}</StatusPill>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
