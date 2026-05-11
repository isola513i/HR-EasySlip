import type { LucideIcon } from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";

type Tone = "success" | "warn" | "error" | "info" | "neutral" | "accent";

const ICON_BG: Record<Tone, string> = {
  success: "bg-(--es-success-50) text-(--es-success-600)",
  warn: "bg-(--es-warn-50) text-(--es-warn-600)",
  error: "bg-(--es-error-50) text-(--es-error-500)",
  info: "bg-(--es-info-50) text-(--es-info-500)",
  neutral: "bg-muted text-muted-foreground",
  accent: "bg-(--es-accent-50) text-(--es-accent-600)",
};

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  tone: Tone;
  icon?: LucideIcon;
}

export function StatCard({ label, value, sub, tone, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-[18px] shadow-(--es-shadow-sm)">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${ICON_BG[tone]}`}>
            <Icon className="size-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div className="tabular-nums mt-1 text-[28px] font-bold leading-tight tracking-tight">
            {value}
          </div>
          {sub && (
            <div className="mt-1.5">
              <StatusPill tone={tone}>{sub}</StatusPill>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
