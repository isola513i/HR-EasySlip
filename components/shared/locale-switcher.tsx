"use client";

import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

const LOCALES = ["th", "en"] as const;
const LOCALE_LABELS: Record<(typeof LOCALES)[number], string> = {
  th: "ภาษาไทย",
  en: "English",
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide"
    >
      {LOCALES.map((l, i) => {
        const active = locale === l;
        return (
          <span key={l} className="inline-flex items-center gap-2">
            {i > 0 ? (
              <span aria-hidden className="opacity-30">
                |
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setLocale(l)}
              aria-pressed={active}
              aria-label={LOCALE_LABELS[l]}
              className={cn(
                "inline-flex min-h-[2.75rem] min-w-[2.75rem] cursor-pointer items-center justify-center uppercase transition-opacity",
                active ? "opacity-100" : "opacity-50 hover:opacity-100",
              )}
            >
              {l}
            </button>
          </span>
        );
      })}
    </div>
  );
}
