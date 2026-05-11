"use client";

import { cn } from "@/lib/utils";

export interface PillOption<T extends string> {
  key: T;
  label: string;
}

type Variant = "outline" | "filled";

interface PillToggleGroupProps<T extends string> {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: Variant;
  /** When true, render in a horizontal scroll strip instead of wrapping. */
  scroll?: boolean;
  className?: string;
  ariaLabel?: string;
}

const VARIANT_SELECTED: Record<Variant, string> = {
  outline:
    "border-[1.5px] border-(--es-accent-600) bg-card text-(--es-accent-700)",
  filled:
    "border border-(--es-accent-600) bg-(--es-accent-600) text-white",
};

const UNSELECTED =
  "border border-(--es-neutral-300) bg-card text-foreground hover:border-(--es-neutral-400)";

export function PillToggleGroup<T extends string>({
  options,
  value,
  onChange,
  variant = "outline",
  scroll = false,
  className,
  ariaLabel,
}: PillToggleGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-2",
        scroll
          ? "-mx-4 overflow-x-auto px-4 [&>button]:shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex-wrap",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.key)}
            className={cn(
              "min-h-11 rounded-full px-5 text-sm font-semibold transition-colors",
              selected ? VARIANT_SELECTED[variant] : UNSELECTED,
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
