"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionLabel } from "@/components/shared/section-label";
import { useT } from "@/lib/i18n/locale-context";
import { useFormat } from "@/hooks/use-format";
import type { Employee } from "@/hooks/use-employees";
import { SalaryHistoryTable } from "./salary-history-table";

interface Props {
  employee: Employee | null;
  onClose: () => void;
  onUpdated: () => void;
}

type EmploymentType = "MONTHLY" | "DAILY" | "INTERN";
type AdjustType = "INITIAL" | "RAISE" | "DEMOTION" | "PROMOTION" | "CORRECTION";

export function SalaryInfoDialog({ employee, onClose, onUpdated }: Props) {
  const t = useT();
  const fmt = useFormat();
  const [revealed, setRevealed] = useState(false);
  const [tab, setTab] = useState<"salary" | "bonus">("salary");
  const [type, setType] = useState<EmploymentType>(employee?.employmentType ?? "MONTHLY");
  const [salary, setSalary] = useState(employee?.baseSalary ?? "");
  const [adjType, setAdjType] = useState<AdjustType>("RAISE");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!employee) return null;

  const reset = () => {
    setRevealed(false); setTab("salary");
    setType(employee.employmentType ?? "MONTHLY");
    setSalary(employee.baseSalary ?? "");
    setAdjType("RAISE"); setNote("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { employmentType: type };
      if (salary !== "") body.baseSalary = Number(salary);
      const changedSalary = String(salary) !== String(employee.baseSalary ?? "");
      if (changedSalary) {
        body.salaryAdjustmentType = adjType;
        if (note.trim()) body.salaryAdjustmentNote = note.trim();
      }
      const res = await fetch(`/api/v1/hr/employees/${employee.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success(t.hr.employees.salarySaved);
      onUpdated();
      reset();
      onClose();
    } catch {
      toast.error(t.hr.employees.salarySaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const formattedSalary = employee.baseSalary
    ? fmt.formatTHB(employee.baseSalary) : null;

  return (
    <Dialog open={!!employee} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.hr.employees.salaryDialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <SectionLabel htmlFor="sal-type">{t.hr.employees.colType}</SectionLabel>
              <Select value={type} onValueChange={(v) => v && setType(v as EmploymentType)}>
                <SelectTrigger id="sal-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">{t.hr.employees.employmentTypes.MONTHLY}</SelectItem>
                  <SelectItem value="DAILY">{t.hr.employees.employmentTypes.DAILY}</SelectItem>
                  <SelectItem value="INTERN">{t.hr.employees.employmentTypes.INTERN}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <SectionLabel htmlFor="sal-base">{t.hr.employees.baseSalary}</SectionLabel>
              <div className="flex items-center gap-2">
                {revealed ? (
                  <Input
                    id="sal-base" type="number" step="0.01" min="0"
                    value={salary} onChange={(e) => setSalary(e.target.value)}
                    placeholder="0.00"
                  />
                ) : (
                  <div
                    className="flex h-9 flex-1 items-center rounded-md border border-input bg-muted/40 px-3 font-mono text-sm tabular-nums text-muted-foreground"
                    aria-label={t.hr.employees.salaryHidden}
                  >
                    {formattedSalary ? "•••••••" : "—"}
                  </div>
                )}
                <Button
                  type="button" variant="ghost" size="icon"
                  onClick={() => setRevealed((v) => !v)}
                  aria-label={revealed ? t.hr.employees.hideSalary : t.hr.employees.showSalary}
                  className="size-9 shrink-0"
                >
                  {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {type === "MONTHLY" ? t.hr.employees.baseSalaryHintMonthly : t.hr.employees.baseSalaryHintDaily}
              </p>
            </div>
          </div>

          {revealed && String(salary) !== String(employee.baseSalary ?? "") && (
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/30 p-3 sm:grid-cols-2">
              <div>
                <SectionLabel htmlFor="adj-type">{t.hr.employees.adjustmentType}</SectionLabel>
                <Select value={adjType} onValueChange={(v) => v && setAdjType(v as AdjustType)}>
                  <SelectTrigger id="adj-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RAISE">{t.hr.employees.adjustmentTypes.RAISE}</SelectItem>
                    <SelectItem value="DEMOTION">{t.hr.employees.adjustmentTypes.DEMOTION}</SelectItem>
                    <SelectItem value="PROMOTION">{t.hr.employees.adjustmentTypes.PROMOTION}</SelectItem>
                    <SelectItem value="CORRECTION">{t.hr.employees.adjustmentTypes.CORRECTION}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <SectionLabel htmlFor="adj-note">{t.hr.employees.adjustmentNote}</SectionLabel>
                <Textarea
                  id="adj-note" rows={2}
                  value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder={t.hr.employees.adjustmentNotePlaceholder}
                />
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold">{t.hr.employees.salaryHistoryTitle}</h3>
            <div className="mb-3 inline-flex gap-1 rounded-lg border bg-muted/40 p-1">
              <button
                type="button" onClick={() => setTab("salary")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${tab === "salary" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {t.hr.employees.tabSalary}
              </button>
              <button
                type="button" onClick={() => setTab("bonus")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${tab === "bonus" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {t.hr.employees.tabBonus}
              </button>
            </div>
            <SalaryHistoryTable employeeId={employee.id} filter={tab} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t.common.saving : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
