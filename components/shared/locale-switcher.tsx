"use client";

import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

const LOCALES = ["th", "en"] as const;

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-full border border-border bg-muted/40 p-0.5 text-[11px] font-medium"
    >
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
