import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardProps {
  label: string;
  value: string | null;
  highlight?: boolean;
}

export function SummaryCard({ label, value, highlight }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      {value === null ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <div
          className={`mt-2 text-2xl font-bold tabular-nums ${
            highlight ? "text-[var(--es-warn-600)]" : "text-foreground"
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
}
