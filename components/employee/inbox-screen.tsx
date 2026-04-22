"use client";

import {
  Check,
  Clock,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

const notifications = [
  {
    tone: "success" as const,
    icon: Check,
    title: "Leave request approved",
    sub: "Sick leave Apr 16 · Approved by Pakin (MANAGER)",
    time: "2 minutes ago",
  },
  {
    tone: "info" as const,
    icon: Clock,
    title: "Clock-out reminder",
    sub: "18:00 approaching · Tap to clock out",
    time: "15 minutes ago",
  },
  {
    tone: "warn" as const,
    icon: CalendarDays,
    title: "Payroll cut-off approaching",
    sub: "Cut-off on the 25th · Submit backdated records before then",
    time: "Yesterday",
  },
  {
    tone: "neutral" as const,
    icon: ShieldCheck,
    title: "PDPA consent recorded",
    sub: "PDPA-EmployeeData-v1.0 · 2026-04-01",
    time: "3 weeks ago",
  },
];

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

export function InboxScreen() {
  return (
    <>
      <header className="flex h-14 items-center border-b border-[var(--es-neutral-100)] px-4">
        <span className="text-base font-semibold">Inbox</span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        {notifications.map((n, i) => {
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
