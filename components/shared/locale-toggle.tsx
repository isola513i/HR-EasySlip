"use client";

import { useLocale } from "@/hooks/use-locale";
import { useT } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

const LOCALES: readonly Locale[] = ["th", "en"];

interface Props {
  variant?: "full" | "compact";
  className?: string;
}

export function LocaleToggle({ variant = "full", className }: Props) {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const next = locale === "th" ? "en" : "th";
  const labelFor = (l: Locale) => l === "th" ? t.common.switchLanguageThai : t.common.switchLanguageEnglish;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => setLocale(next)}
        aria-label={labelFor(next)}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-md text-[11px] font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          className,
        )}
      >
        {locale}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={cn(
        "relative grid h-9 w-full grid-cols-2 items-center rounded-lg border border-border bg-(--es-neutral-50) p-0.5 text-[11px] font-semibold uppercase tracking-wider",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0.5 w-[calc(50%-2px)] rounded-md bg-(--es-accent-600) shadow-(--es-shadow-sm) transition-transform duration-200 ease-out",
          locale === "en" ? "translate-x-[calc(100%+0px)]" : "translate-x-0",
        )}
      />
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            aria-label={labelFor(l)}
            className={cn(
              "relative z-10 flex h-full cursor-pointer items-center justify-center rounded-md transition-colors",
              active ? "text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
