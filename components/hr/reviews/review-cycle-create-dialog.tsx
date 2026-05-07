"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionLabel } from "@/components/shared/section-label";
import { useReviewCycles, type ReviewCadence, type ReviewTemplate } from "@/hooks/use-reviews";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  open: boolean;
  templates: ReviewTemplate[];
  onClose: () => void;
}

export function ReviewCycleCreateDialog({ open, templates, onClose }: Props) {
  const t = useT();
  const { createCycle } = useReviewCycles();
  const [name, setName] = useState("");
  const [cadence, setCadence] = useState<ReviewCadence>("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName(""); setCadence("ANNUAL"); setStartDate(""); setEndDate(""); setTemplateId("");
  };

  const canSubmit = name.trim() && startDate && endDate && templateId;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createCycle({ name: name.trim(), cadence, startDate, endDate, templateId });
      toast.success(t.hr.reviews.cycleCreated);
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.hr.reviews.cycleFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.hr.reviews.cycleDialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <SectionLabel htmlFor="cycle-name">{t.hr.reviews.cycleName}</SectionLabel>
            <Input id="cycle-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="2026 Q1" />
          </div>
          <div>
            <SectionLabel htmlFor="cycle-cadence">{t.hr.reviews.cadence}</SectionLabel>
            <Select value={cadence} onValueChange={(v) => setCadence(v as ReviewCadence)}>
              <SelectTrigger id="cycle-cadence"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="QUARTERLY">{t.hr.reviews.cadences.QUARTERLY}</SelectItem>
                <SelectItem value="ANNUAL">{t.hr.reviews.cadences.ANNUAL}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SectionLabel htmlFor="cycle-start">{t.hr.reviews.startDate}</SectionLabel>
              <Input id="cycle-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <SectionLabel htmlFor="cycle-end">{t.hr.reviews.endDate}</SectionLabel>
              <Input id="cycle-end" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <SectionLabel htmlFor="cycle-template">{t.hr.reviews.template}</SectionLabel>
            <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
              <SelectTrigger id="cycle-template"><SelectValue placeholder={t.hr.reviews.selectTemplate} /></SelectTrigger>
              <SelectContent>
                {templates.map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? t.common.saving : t.hr.reviews.createCycle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
