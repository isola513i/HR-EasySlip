import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type KpiTone = "accent" | "info" | "success" | "warn" | "error" | "neutral";

const ICON_TONE: Record<KpiTone, string> = {
  accent: "bg-[var(--es-accent-50)] text-[var(--es-accent-600)]",
  info: "bg-[var(--es-info-50)] text-[var(--es-info-600)]",
  success: "bg-[var(--es-success-50)] text-[var(--es-success-600)]",
  warn: "bg-[var(--es-warn-50)] text-[var(--es-warn-600)]",
  error: "bg-[var(--es-error-50)] text-[var(--es-error-600)]",
  neutral: "bg-[var(--es-neutral-100)] text-[var(--es-neutral-700)]",
};

interface KpiCardProps {
  Icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: KpiTone;
}

export function KpiCard({ Icon, label, value, sub, tone = "accent" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
      <div className="flex items-center gap-2.5">
        <span className={`grid size-8 place-items-center rounded-lg ${ICON_TONE[tone]}`}>
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 text-[28px] font-bold leading-none tabular-nums">{value}</div>
      {sub && <div className="mt-2 text-[12px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function KpiCardSkeleton() {
  return <Skeleton className="h-[120px] w-full rounded-xl" />;
}

interface KpiGridProps {
  count?: number;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function KpiGrid({ count = 4, isLoading, children }: KpiGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => <KpiCardSkeleton key={i} />)}
      </div>
    );
  }
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
