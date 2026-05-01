"use client";

import { CheckCircle2, AlertCircle, XCircle, ShieldCheck } from "lucide-react";
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card";
import { useT } from "@/lib/i18n/locale-context";
import type { PdpaOverview } from "@/lib/consent/consent-service";

interface Props {
  totals: PdpaOverview["totals"];
  isLoading?: boolean;
}

function complianceLabel(grade: PdpaOverview["totals"]["complianceGrade"], t: ReturnType<typeof useT>): string {
  if (grade === "A+" || grade === "A") return t.hr.pdpa.kpiComplianceSub.excellent;
  if (grade === "B") return t.hr.pdpa.kpiComplianceSub.good;
  if (grade === "C") return t.hr.pdpa.kpiComplianceSub.fair;
  return t.hr.pdpa.kpiComplianceSub.poor;
}

export function PdpaKpis({ totals, isLoading }: Props) {
  const t = useT();
  return (
    <KpiGrid count={4} isLoading={isLoading}>
      <KpiCard
        Icon={CheckCircle2}
        tone="success"
        label={t.hr.pdpa.kpiConsentRate}
        value={`${totals.consentRate}%`}
        sub={t.hr.pdpa.kpiConsentRateSubFmt
          .replace("{consented}", String(totals.consented))
          .replace("{total}", String(totals.totalEmployees))}
      />
      <KpiCard
        Icon={AlertCircle}
        tone="warn"
        label={t.hr.pdpa.kpiPending}
        value={totals.pending}
        sub={t.hr.pdpa.kpiPendingSub}
      />
      <KpiCard
        Icon={XCircle}
        tone="error"
        label={t.hr.pdpa.kpiPartial}
        value={totals.partial}
        sub={t.hr.pdpa.kpiPartialSub}
      />
      <KpiCard
        Icon={ShieldCheck}
        tone="accent"
        label={t.hr.pdpa.kpiCompliance}
        value={totals.complianceGrade}
        sub={complianceLabel(totals.complianceGrade, t)}
      />
    </KpiGrid>
  );
}
