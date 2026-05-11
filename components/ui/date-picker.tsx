"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { th as thLocale } from "date-fns/locale/th";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocale } from "@/hooks/use-locale";
import { useT } from "@/lib/i18n/locale-context";

interface DatePickerProps {
  /** ISO YYYY-MM-DD or empty string */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
}

function toDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatLabel(iso: string, localeTag: string): string {
  const d = toDate(iso);
  if (!d) return "";
  return d.toLocaleDateString(localeTag, { day: "numeric", month: "short", year: "numeric" });
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  min,
  max,
  className,
}: DatePickerProps) {
  const t = useT();
  const { locale } = useLocale();
  const localeTag = locale === "th" ? "th-TH" : "en-GB";
  const dpLocale = locale === "th" ? thLocale : undefined;
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);
  const minDate = min ? toDate(min) : undefined;
  const maxDate = max ? toDate(max) : undefined;
  const finalPlaceholder = placeholder ?? t.common.selectDate;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-input bg-card px-3.5 text-[13px] shadow-[inset_0_1px_0_rgba(15,23,42,0.02)] outline-none transition-[border-color,box-shadow] duration-150",
          "hover:border-(--es-neutral-300)",
          "focus-visible:border-(--es-accent-400) focus-visible:ring-[3px] focus-visible:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "data-popup-open:border-(--es-accent-400)",
          !value && "text-muted-foreground/70",
          className,
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{value ? formatLabel(value, localeTag) : finalPlaceholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={dpLocale}
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            if (!d) return;
            onChange(toISO(d));
            setOpen(false);
          }}
          disabled={(d) => {
            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
