"use client";

import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useHrDashboardSummary } from "@/hooks/use-hr-dashboard-summary";
import { useT } from "@/lib/i18n/locale-context";

type Tone = "success" | "info" | "warn" | "accent" | "neutral" | "error";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: { value: number; suffix?: string } | { text: string } | null;
  icon: LucideIcon;
  tone: Tone;
}

const ICON_BG: Record<Tone, string> = {
  success: "bg-[var(--es-success-50)] text-[var(--es-success-600)]",
  info: "bg-[var(--es-info-50)] text-[var(--es-info-500)]",
  warn: "bg-[var(--es-warn-50)] text-[var(--es-warn-600)]",
  accent: "bg-[var(--es-accent-50)] text-[var(--es-accent-600)]",
  neutral: "bg-muted text-muted-foreground",
  error: "bg-[var(--es-error-50)] text-[var(--es-error-500)]",
};

function DeltaPill({ delta }: { delta: KpiCardProps["delta"] }) {
  if (!delta) return null;
  if ("text" in delta) {
    return <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{delta.text}</span>;
  }
  const positive = delta.value > 0;
  return (
    <span
      className={`tabular-nums text-[11px] font-semibold ${
        positive ? "text-success" : "text-(--es-error-500)"
      }`}
    >
      {positive ? "+" : ""}{delta.value}{delta.suffix ?? ""}
    </span>
  );
}

function KpiCard({ label, value, delta, icon: Icon, tone }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-(--es-shadow-sm)">
      <div className="flex items-start justify-between">
        <div className={`grid size-10 place-items-center rounded-xl ${ICON_BG[tone]}`}>
          <Icon className="size-5" />
        </div>
        <DeltaPill delta={delta} />
      </div>
      <div className="mt-5 text-[13px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[26px] font-bold leading-tight tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

export function KpiGrid() {
  const t = useT();
  const { data, isLoading } = useHrDashboardSummary();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[148px] rounded-xl" />)}
      </div>
    );
  }

  const k = t.hr.dashboard;
  const payrollLabel = data.payrollStatus.status === "NONE"
    ? k.payrollNoActive
    : k.payrollStatusValues[data.payrollStatus.status];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label={k.totalEmployees}
        value={String(data.totalEmployees.value)}
        delta={data.totalEmployees.delta != null ? { value: data.totalEmployees.delta } : null}
        icon={Users}
        tone="info"
      />
      <KpiCard
        label={k.newHires}
        value={String(data.newHires.value)}
        delta={data.newHires.delta != null ? { value: data.newHires.delta } : null}
        icon={UserPlus}
        tone="accent"
      />
      <KpiCard
        label={k.pendingApprovals}
        value={String(data.pendingApprovals.value)}
        delta={data.pendingApprovals.value > 0 ? { text: k.actionRequired } : null}
        icon={CheckCircle2}
        tone="warn"
      />
      <KpiCard
        label={k.todayAttendance}
        value={String(data.todayAttendance.value)}
        delta={data.todayAttendance.delta != null ? { value: data.todayAttendance.delta } : null}
        icon={Clock}
        tone="success"
      />
      <KpiCard
        label={k.payrollStatus}
        value={payrollLabel}
        delta={data.payrollStatus.cycleLabel ? { text: data.payrollStatus.cycleLabel } : null}
        icon={DollarSign}
        tone="success"
      />
      <KpiCard
        label={k.avgHoursToday}
        value={`${data.avgHoursToday.value.toFixed(1)} h`}
        delta={null}
        icon={TrendingUp}
        tone="info"
      />
    </div>
  );
}
