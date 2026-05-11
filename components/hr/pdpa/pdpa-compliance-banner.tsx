"use client";

import { Shield } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import type { PdpaOverview } from "@/lib/consent/pdpa-overview-service";

interface Props {
  policy: PdpaOverview["policy"];
}

export function PdpaComplianceBanner({ policy }: Props) {
  const t = useT();
  const fmt = useFormat();

  return (
    <div className="flex items-start gap-3 rounded-xl border border-(--es-info-200) bg-(--es-info-50) p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card text-(--es-info-600)">
        <Shield className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{t.hr.pdpa.complianceTitle}</div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{t.hr.pdpa.complianceBody}</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{t.hr.pdpa.complianceLastUpdated}:</span>{" "}
            {fmt.formatShortDate(policy.lastUpdatedAt, "numeric")}
          </span>
          <span>
            <span className="font-semibold text-foreground">{t.hr.pdpa.compliancePolicyVersion}:</span>{" "}
            {policy.version}
          </span>
          <span>
            <span className="font-semibold text-foreground">{t.hr.pdpa.complianceNextReview}:</span>{" "}
            {fmt.formatShortDate(policy.nextReviewAt, "numeric")}
          </span>
        </div>
      </div>
    </div>
  );
}
