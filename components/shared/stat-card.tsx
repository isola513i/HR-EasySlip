import { StatusPill } from "@/components/shared/status-pill";

type Tone = "success" | "warn" | "error" | "info" | "neutral" | "accent";

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  tone: Tone;
}

export function StatCard({ label, value, sub, tone }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-[18px] shadow-[var(--es-shadow-sm)]">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="tabular-nums mt-1 text-[28px] font-bold leading-tight tracking-tight">
        {value}
      </div>
      <div className="mt-1.5">
        <StatusPill tone={tone}>{sub}</StatusPill>
      </div>
    </div>
  );
}
