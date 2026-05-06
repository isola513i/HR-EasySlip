"use client";

import { cn } from "@/lib/utils";

interface LeaveTypeCardProps {
  label: string;
  balanceText: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function LeaveTypeCard({
  label,
  balanceText,
  selected,
  disabled = false,
  onSelect,
}: LeaveTypeCardProps) {
  return (
    <button
      type="button"
      onClick={() => { if (!disabled) onSelect(); }}
      disabled={disabled}
      aria-disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "rounded-xl px-4 py-3 text-left transition-colors",
        selected
          ? "border-[1.5px] border-[var(--es-accent-600)] bg-[var(--es-accent-50)]"
          : "border border-[var(--es-neutral-300)] bg-card hover:border-[var(--es-neutral-400)]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div
        className={cn(
          "text-base font-bold",
          selected ? "text-[var(--es-accent-700)]" : "text-foreground",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "tabular-nums mt-1 text-xs",
          selected ? "text-[var(--es-accent-700)]/80" : "text-muted-foreground",
        )}
      >
        {balanceText}
      </div>
    </button>
  );
}
