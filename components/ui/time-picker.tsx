"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimePickerProps {
  /** "HH:mm" 24-hour format, or empty string */
  value: string;
  onChange: (value: string) => void;
  /** Minute step granularity. Default 5. */
  step?: 1 | 5 | 10 | 15 | 30;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

function parseValue(v: string): { h: string; m: string } {
  const [h = "", m = ""] = v.split(":");
  return { h: h.length === 2 ? h : "", m: m.length === 2 ? m : "" };
}

function ScrollColumn({
  options,
  selected,
  onPick,
  ariaLabel,
}: {
  options: string[];
  selected: string;
  onPick: (v: string) => void;
  ariaLabel: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const selectedRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (selectedRef.current && ref.current) {
      const el = selectedRef.current;
      const parent = ref.current;
      parent.scrollTop = el.offsetTop - parent.clientHeight / 2 + el.clientHeight / 2;
    }
  }, []);

  return (
    <div ref={ref} role="listbox" aria-label={ariaLabel} className="h-48 w-16 overflow-y-auto scroll-smooth py-1 [scrollbar-width:thin]">
      <div className="flex flex-col gap-0.5">
        {options.map((opt) => {
          const active = opt === selected;
          return (
            <button
              key={opt}
              ref={active ? selectedRef : null}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onPick(opt)}
              className={cn(
                "tabular-nums rounded-md px-2 py-1.5 text-center text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--es-accent-100)] text-[var(--es-accent-700)]"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TimePicker({
  value,
  onChange,
  step = 5,
  placeholder = "HH:mm",
  disabled,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { h, m } = parseValue(value);
  const minutes = React.useMemo(
    () =>
      Array.from({ length: Math.floor(60 / step) }, (_, i) =>
        String(i * step).padStart(2, "0"),
      ),
    [step],
  );

  const update = (nextH: string, nextM: string) => {
    if (nextH && nextM) {
      onChange(`${nextH}:${nextM}`);
      setOpen(false);
    } else {
      onChange(`${nextH}:${nextM || "00"}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] outline-none transition-colors",
          "hover:border-[var(--es-neutral-300)]",
          "focus-visible:border-[var(--es-accent-400)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-popup-open:border-[var(--es-accent-400)]",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <Clock className="size-4 shrink-0 text-muted-foreground" />
        <span className="tabular-nums">{value || placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2">
        <div className="flex items-center gap-1">
          <ScrollColumn
            options={HOURS}
            selected={h}
            onPick={(v) => update(v, m)}
            ariaLabel="Hour"
          />
          <span className="select-none text-base font-semibold text-muted-foreground">:</span>
          <ScrollColumn
            options={minutes}
            selected={m}
            onPick={(v) => update(h, v)}
            ariaLabel="Minute"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
