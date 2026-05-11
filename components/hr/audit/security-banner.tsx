"use client";

import { ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  totalEntries: number;
}

export function SecurityComplianceBanner({ totalEntries }: Props) {
  const t = useT();
  const totalText = t.hr.audit.totalValueFmt.replace(
    "{count}",
    totalEntries.toLocaleString("en-US"),
  );
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-(--es-shadow-sm)">
      <div className="flex items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-(--es-accent-50) text-(--es-accent-600)">
          <ShieldCheck className="size-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{t.hr.audit.complianceTitle}</div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {t.hr.audit.complianceBody}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            <div>
              <span>{t.hr.audit.retentionLabel}:</span>{" "}
              <span className="font-semibold text-foreground">{t.hr.audit.retentionValue}</span>
            </div>
            <div className="hidden sm:block">·</div>
            <div>
              <span>{t.hr.audit.totalLabel}:</span>{" "}
              <span className="font-semibold text-foreground tabular-nums">{totalText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
