"use client";

import { type ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock as ClockIcon, FileText, type LucideIcon } from "lucide-react";
import { ClockDisplay } from "@/components/employee/home/clock-display";
import { useClockStatus } from "@/hooks/use-clock-status";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function useElapsedTime(inTime: string | null): string | null {
  const [elapsed, setElapsed] = useState<string | null>(null);

  useEffect(() => {
    if (!inTime) { setElapsed(null); return; }
    const compute = () => {
      const [h, m] = inTime.split(":").map(Number);
      const now = new Date();
      const clockIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      const diffMs = now.getTime() - clockIn.getTime();
      if (diffMs < 0) { setElapsed(null); return; }
      const totalMin = Math.floor(diffMs / 60000);
      const hrs = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      setElapsed(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`);
    };
    compute();
    const id = setInterval(compute, 60000);
    return () => clearInterval(id);
  }, [inTime]);

  return elapsed;
}

interface HeroClockCardProps {
  dict: Dictionary;
  shiftStartLabel: string;
}

type ActiveState = "idle" | "in" | "out";

const DOT_TONE: Record<ActiveState, string> = {
  idle: "bg-[var(--es-neutral-400)]",
  in: "bg-[var(--es-success-500)]",
  out: "bg-[var(--es-accent-400)]",
};

const ACTION_TONE_CLASS: Record<"primary" | "outline" | "ghost", string> = {
  primary: "bg-[var(--es-accent-600)] text-white hover:bg-[var(--es-accent-700)]",
  outline: "border border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.08]",
  ghost: "border border-white/10 bg-transparent text-white/85 hover:bg-white/[0.04]",
};

export function HeroClockCard({ dict, shiftStartLabel }: HeroClockCardProps) {
  const { state, inTime, outTime } = useClockStatus();
  const elapsed = useElapsedTime(state === "in" ? inTime : null);
  const e = dict.employee;

  const STATUS_LABEL: Record<ActiveState, string> = {
    idle: e.notStarted,
    in: e.working,
    out: e.dayComplete,
  };

  const ACTION: Record<ActiveState, { href: string; tone: "primary" | "outline" | "ghost"; icon: LucideIcon; label: string }> = {
    idle: { href: "/employee/clock", tone: "primary", icon: ClockIcon, label: e.clockIn },
    in: { href: "/employee/clock", tone: "outline", icon: ClockIcon, label: e.clockOut },
    out: { href: "/employee/timesheet", tone: "ghost", icon: FileText, label: e.viewTimesheet },
  };

  const META: Record<ActiveState, ReactNode> = {
    idle: shiftStartLabel,
    in: (
      <span className="flex items-center gap-2">
        <span>{e.clockedInAt.replace("{time}", inTime ?? "—")}</span>
        {elapsed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.10] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/70">
            {elapsed} · {e.workedToday}
          </span>
        )}
      </span>
    ),
    out: `${e.clockedInAt.replace("{time}", inTime ?? "—")} · ${e.clockedOutAt.replace("{time}", outTime ?? "—")}`,
  };

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-[var(--es-neutral-900)] p-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
            {e.todayTitle}
          </div>
          <ClockDisplay />
        </div>
        {state !== "loading" && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/85">
            <span aria-hidden className={`size-1.5 rounded-full ${DOT_TONE[state]}`} />
            {STATUS_LABEL[state]}
          </div>
        )}
      </div>

      {state !== "loading" && (
        <>
          <div className="mt-4">
            <ActionButton {...ACTION[state]} />
          </div>
          <div className="mt-3 text-[11px] text-white/50">{META[state]}</div>
        </>
      )}
    </div>
  );
}

function ActionButton({
  href,
  tone,
  icon: Icon,
  label,
}: {
  href: string;
  tone: "primary" | "outline" | "ghost";
  icon: LucideIcon;
  label: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex h-14 items-center justify-between rounded-2xl px-5 text-[15px] font-semibold transition-colors ${ACTION_TONE_CLASS[tone]}`}
    >
      <span className="flex items-center gap-3">
        <Icon className="size-5" strokeWidth={2} />
        {label}
      </span>
      <ArrowRight className="size-4 opacity-80" />
    </Link>
  );
}
