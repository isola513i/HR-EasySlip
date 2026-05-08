"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import { useSalaryHistory, type HistoryFilter, type SalaryAdjustmentType } from "@/hooks/use-salary-history";

interface Props {
  employeeId: string;
  filter: HistoryFilter;
}

const TYPE_KEY: Record<SalaryAdjustmentType, "INITIAL" | "RAISE" | "DEMOTION" | "PROMOTION" | "CORRECTION" | "BONUS_GRANT"> = {
  INITIAL: "INITIAL", RAISE: "RAISE", DEMOTION: "DEMOTION",
  PROMOTION: "PROMOTION", CORRECTION: "CORRECTION", BONUS_GRANT: "BONUS_GRANT",
};

export function SalaryHistoryTable({ employeeId, filter }: Props) {
  const t = useT();
  const fmt = useFormat();
  const { items, isLoading, error } = useSalaryHistory(employeeId, filter);

  if (isLoading) {
    return <div className="space-y-1.5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>;
  }
  if (error) return <div className="text-xs text-destructive">{error}</div>;
  if (items.length === 0) {
    return <div className="rounded-lg border bg-muted/20 p-6 text-center text-xs text-muted-foreground">{t.hr.employees.salaryHistoryEmpty}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border text-xs">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/40 text-left">
            <th className="px-2 py-1.5 font-medium">{t.hr.employees.colEffectiveDate}</th>
            <th className="px-2 py-1.5 font-medium">{t.hr.employees.colAdjustmentType}</th>
            <th className="px-2 py-1.5 text-right font-medium">{t.hr.employees.colSalaryBefore}</th>
            <th className="px-2 py-1.5 text-right font-medium">{t.hr.employees.colSalaryAfter}</th>
            <th className="px-2 py-1.5 text-right font-medium">{t.hr.employees.colRatePct}</th>
            <th className="px-2 py-1.5 font-medium">{t.hr.employees.colNote}</th>
            <th className="px-2 py-1.5 font-medium">{t.hr.employees.colActor}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-2 py-1.5 tabular-nums">{fmt.formatShortDate(r.effectiveDate, "numeric")}</td>
              <td className="px-2 py-1.5">{t.hr.employees.adjustmentTypes[TYPE_KEY[r.adjustmentType]]}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.salaryBefore ? fmt.formatTHB(r.salaryBefore) : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{fmt.formatTHB(r.salaryAfter)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {r.ratePct ? `${Number(r.ratePct) >= 0 ? "+" : ""}${Number(r.ratePct).toFixed(2)}%` : "—"}
              </td>
              <td className="max-w-[160px] truncate px-2 py-1.5">{r.note ?? "—"}</td>
              <td className="px-2 py-1.5">{r.actorName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
