"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionLabel } from "@/components/shared/section-label";
import { useT } from "@/lib/i18n/locale-context";
import { useMyExpenses, type ExpenseCategory } from "@/hooks/use-expense";

interface Props { open: boolean; onClose: () => void }

const CATEGORIES: ExpenseCategory[] = ["TRAVEL", "MEAL", "EQUIPMENT", "TRAINING", "CLIENT", "OTHER"];

export function ExpenseSubmitDialog({ open, onClose }: Props) {
  const t = useT();
  const { submit } = useMyExpenses();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("TRAVEL");
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setAmount(""); setCategory("TRAVEL"); setDescription(""); setOccurredOn("");
  };

  const canSubmit = amount && Number(amount) > 0 && description.trim().length >= 5 && occurredOn;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submit({
        amountTHB: Number(amount),
        category,
        description: description.trim(),
        occurredOn,
      });
      toast.success(t.hr.expense.submittedSuccess);
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.hr.expense.submittedFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t.hr.expense.newTitle}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <SectionLabel htmlFor="exp-amount">{t.hr.expense.amount}</SectionLabel>
            <Input id="exp-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <SectionLabel htmlFor="exp-cat">{t.hr.expense.category}</SectionLabel>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger id="exp-cat"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{t.hr.expense.categories[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <SectionLabel htmlFor="exp-date">{t.hr.expense.occurredOn}</SectionLabel>
            <Input id="exp-date" type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} />
          </div>
          <div>
            <SectionLabel htmlFor="exp-desc">{t.hr.expense.description}</SectionLabel>
            <Textarea id="exp-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? t.common.saving : t.hr.expense.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
