"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/locale-context";
import type { Holiday } from "@/hooks/use-holidays";

export interface HolidayDialogPayload {
  date: string;
  name: string;
  nameEn?: string;
  isSubstituted: boolean;
}

interface Props {
  open: boolean;
  /** When provided, dialog is in edit mode; otherwise it's create mode. */
  editing: Holiday | null;
  /** Optional preset date for create mode (e.g. clicked on a calendar cell). */
  presetDate?: string;
  onClose: () => void;
  onSubmit: (payload: HolidayDialogPayload) => Promise<void>;
}

interface FormState {
  date: string;
  name: string;
  nameEn: string;
  isSubstituted: boolean;
}

const EMPTY: FormState = { date: "", name: "", nameEn: "", isSubstituted: false };

function fromHoliday(h: Holiday): FormState {
  return {
    date: h.date.slice(0, 10),
    name: h.name,
    nameEn: h.nameEn ?? "",
    isSubstituted: h.isSubstituted,
  };
}

export function HolidayDialog({ open, editing, presetDate, onClose, onSubmit }: Props) {
  const t = useT();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  // Sync form state whenever the dialog (re-)opens with a different target.
  useEffect(() => {
    if (!open) return;
    if (editing) setForm(fromHoliday(editing));
    else setForm({ ...EMPTY, date: presetDate ?? "" });
  }, [open, editing, presetDate]);

  const handleSave = async () => {
    if (!form.date || !form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        date: form.date,
        name: form.name.trim(),
        nameEn: form.nameEn.trim() || undefined,
        isSubstituted: form.isSubstituted,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t.hr.editHolidayTitle : t.hr.addHolidayTitle}</DialogTitle>
          <DialogDescription>{t.hr.holidaysPageSubtitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label>{t.hr.holidayDate}</Label>
            <DatePicker
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.hr.holidayNameTh}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t.hr.holidayNameThPlaceholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.hr.holidayNameEn}</Label>
            <Input
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              placeholder={t.hr.holidayNameEnPlaceholder}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <Checkbox
              checked={form.isSubstituted}
              onCheckedChange={(v) => setForm({ ...form, isSubstituted: !!v })}
            />
            {t.hr.substitutedCheckbox}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button
            disabled={!form.date || !form.name.trim() || saving}
            onClick={handleSave}
          >
            {saving ? t.common.saving : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
