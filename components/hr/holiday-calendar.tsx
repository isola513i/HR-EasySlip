"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHolidays, type Holiday } from "@/hooks/use-holidays";
import { useT } from "@/lib/i18n/locale-context";

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

export function HolidayCalendar() {
  const t = useT();
  const { holidays, isLoading, error: fetchError, year, setYear, create, update, remove } = useHolidays(2026);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ date: "", name: "", nameEn: "", isSubstituted: false });
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setForm({ date: "", name: "", nameEn: "", isSubstituted: false });
    setEditing(null);
    setIsNew(true);
  };

  const openEdit = (h: Holiday) => {
    setForm({ date: h.date.slice(0, 10), name: h.name, nameEn: h.nameEn ?? "", isSubstituted: h.isSubstituted });
    setEditing(h);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!form.date || !form.name.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        await create({ date: form.date, name: form.name.trim(), nameEn: form.nameEn.trim() || undefined, isSubstituted: form.isSubstituted });
        toast.success(t.hr.holidayAdded);
      } else if (editing) {
        await update(editing.id, { date: form.date, name: form.name.trim(), nameEn: form.nameEn.trim() || undefined, isSubstituted: form.isSubstituted });
        toast.success(t.hr.holidayUpdated);
      }
      setEditing(null);
      setIsNew(false);
    } catch { toast.error(t.common.saveFailed); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await remove(id); toast.success(t.hr.holidayDeleted); }
    catch { toast.error(t.common.deleteFailed); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {YEARS.map((y) => (
            <Button key={y} variant={year === y ? "default" : "outline"} size="sm" onClick={() => setYear(y)}>
              {y}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={openNew}><Plus className="mr-1.5 size-4" /> {t.hr.addHoliday}</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : fetchError ? (
        <div className="py-16 text-center text-[var(--es-error-500)]">{fetchError}</div>
      ) : holidays.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t.hr.noHolidays.replace("{year}", String(year))}</div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">{t.hr.holidayDate}</TableHead>
                <TableHead>{t.hr.holidayNameTh}</TableHead>
                <TableHead>{t.hr.holidayNameEn}</TableHead>
                <TableHead className="w-[100px]">{t.hr.holidayType}</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="tabular-nums font-medium">
                    {new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </TableCell>
                  <TableCell>{h.name}</TableCell>
                  <TableCell className="text-muted-foreground">{h.nameEn ?? "—"}</TableCell>
                  <TableCell>{h.isSubstituted ? <Badge variant="secondary">{t.hr.substituted}</Badge> : <Badge variant="outline">{t.hr.regular}</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(h)} className="rounded p-1 hover:bg-muted"><Pencil className="size-3.5" /></button>
                      <button onClick={() => handleDelete(h.id)} className="rounded p-1 text-[var(--es-error-500)] hover:bg-[var(--es-error-50)]"><Trash2 className="size-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isNew || !!editing} onOpenChange={(o) => { if (!o) { setIsNew(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{isNew ? t.hr.addHolidayTitle : t.hr.editHolidayTitle}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t.hr.holidayDate}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>{t.hr.holidayNameTh}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t.hr.holidayNameThPlaceholder} /></div>
            <div><Label>{t.hr.holidayNameEn}</Label><Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder={t.hr.holidayNameEnPlaceholder} /></div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.isSubstituted} onCheckedChange={(v) => setForm({ ...form, isSubstituted: !!v })} />
              {t.hr.substitutedCheckbox}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsNew(false); setEditing(null); }}>{t.common.cancel}</Button>
            <Button disabled={!form.date || !form.name.trim() || saving} onClick={handleSave}>{saving ? t.common.saving : t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
