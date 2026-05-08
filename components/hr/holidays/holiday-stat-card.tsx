import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: "neutral" | "accent" | "muted";
}

const TONE_CLASSES: Record<NonNullable<Props["tone"]>, { bg: string; fg: string }> = {
  neutral: {
    bg: "bg-[var(--es-neutral-100)]",
    fg: "text-foreground",
  },
  accent: {
    bg: "bg-[var(--es-accent-50)]",
    fg: "text-[var(--es-accent-700)]",
  },
  muted: {
    bg: "bg-muted/60",
    fg: "text-muted-foreground",
  },
};

export function HolidayStatCard({ icon: Icon, label, value, tone = "neutral" }: Props) {
  const styles = TONE_CLASSES[tone];
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-card p-4 ring-1 ring-[var(--border-subtle)] shadow-[var(--es-shadow-xs)]">
      <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", styles.bg, styles.fg)}>
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[12.5px] font-medium text-muted-foreground">{label}</div>
        <div className="text-[24px] font-bold leading-none tracking-tight tabular-nums">{value}</div>
      </div>
    </div>
  );
}
