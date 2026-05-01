"use client";

import { useT } from "@/lib/i18n/locale-context";
import type { PdpaOverview } from "@/lib/consent/consent-service";
import type { ConsentCategory } from "@/lib/consent/categories";

interface Props {
  categories: PdpaOverview["categories"];
  totalEmployees: number;
}

export function PdpaCategories({ categories, totalEmployees }: Props) {
  const t = useT();

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--es-shadow-sm)]">
      <div className="text-base font-semibold">{t.hr.pdpa.categoriesTitle}</div>

      <div className="mt-4 flex flex-col gap-3">
        {categories.map((c) => {
          const key = c.key as ConsentCategory;
          const pct = totalEmployees === 0 ? 0 : (c.consented / totalEmployees) * 100;
          return (
            <div key={c.key} className="rounded-lg border border-border p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold">{t.hr.pdpa.categoryNames[key]}</span>
                    {c.required && (
                      <span className="rounded-md bg-[var(--es-error-50)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--es-error-600)]">
                        {t.hr.pdpa.categoryRequired}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">
                    {t.hr.pdpa.categoryDescriptions[key]}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[18px] font-bold tabular-nums leading-none">{c.consented}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{t.hr.pdpa.categoryConsented}</div>
                </div>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--es-neutral-100)]">
                <div
                  className="h-full rounded-full bg-[var(--es-success-500)] transition-[width] duration-300"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
