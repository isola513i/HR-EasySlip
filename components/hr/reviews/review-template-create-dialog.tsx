"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionLabel } from "@/components/shared/section-label";
import { useReviewCycles, type ReviewQuestion } from "@/hooks/use-reviews";
import { useT } from "@/lib/i18n/locale-context";

interface Props { open: boolean; onClose: () => void }

interface DraftQuestion {
  key: string;
  label: string;
  type: "scale" | "text";
  required: boolean;
}

function emptyDraft(idx: number): DraftQuestion {
  return { key: `q${idx + 1}`, label: "", type: "scale", required: true };
}

export function ReviewTemplateCreateDialog({ open, onClose }: Props) {
  const t = useT();
  const { createTemplate } = useReviewCycles();
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyDraft(0)]);
  const [submitting, setSubmitting] = useState(false);

  const updateQ = (idx: number, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  const addQ = () => setQuestions((qs) => [...qs, emptyDraft(qs.length)]);
  const removeQ = (idx: number) => setQuestions((qs) => qs.filter((_, i) => i !== idx));

  const reset = () => { setName(""); setQuestions([emptyDraft(0)]); };

  const canSubmit = name.trim().length > 0 && questions.every((q) => q.key.trim() && q.label.trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: ReviewQuestion[] = questions.map((q) => ({
        key: q.key.trim(),
        label: q.label.trim(),
        type: q.type,
        required: q.required,
      }));
      await createTemplate({ name: name.trim(), questions: payload });
      toast.success(t.hr.reviews.templateCreated);
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.hr.reviews.templateFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.hr.reviews.templateDialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <SectionLabel htmlFor="tmpl-name">{t.hr.reviews.templateName}</SectionLabel>
            <Input id="tmpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Annual review 2026" />
          </div>
          <div className="space-y-2">
            <SectionLabel>{t.hr.reviews.questions}</SectionLabel>
            {questions.map((q, idx) => (
              <div key={idx} className="grid grid-cols-[80px_1fr_120px_36px_36px] items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
                <Input value={q.key} onChange={(e) => updateQ(idx, { key: e.target.value })} placeholder="key" className="font-mono text-xs" />
                <Input value={q.label} onChange={(e) => updateQ(idx, { label: e.target.value })} placeholder={t.hr.reviews.questionLabel} />
                <Select value={q.type} onValueChange={(v) => updateQ(idx, { type: v as "scale" | "text" })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scale">{t.hr.reviews.qScale}</SelectItem>
                    <SelectItem value="text">{t.hr.reviews.qText}</SelectItem>
                  </SelectContent>
                </Select>
                <label className="grid place-items-center" title={t.hr.reviews.required}>
                  <Checkbox checked={q.required} onCheckedChange={(v) => updateQ(idx, { required: !!v })} />
                </label>
                <button onClick={() => removeQ(idx)} disabled={questions.length === 1} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addQ} className="gap-1.5">
              <Plus className="size-3.5" /> {t.hr.reviews.addQuestion}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? t.common.saving : t.hr.reviews.createTemplate}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
