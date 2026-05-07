"use client";

import { useEffect, useState } from "react";
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
import { apiFetch } from "@/lib/api/client";
import { useOffboarding, type OffboardingReason } from "@/hooks/use-offboarding";
import { useT } from "@/lib/i18n/locale-context";

interface Props { open: boolean; onClose: () => void }

interface EmployeeOption {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
}

export function OffboardingStartDialog({ open, onClose }: Props) {
  const t = useT();
  const { start } = useOffboarding();
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [reason, setReason] = useState<OffboardingReason>("RESIGNATION");
  const [lastDay, setLastDay] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiFetch<EmployeeOption[] | { data: EmployeeOption[] }>("/api/v1/hr/employees?perPage=100&status=ACTIVE")
      .then((res) => setEmployees(Array.isArray(res) ? res : res.data))
      .catch(() => setEmployees([]));
  }, [open]);

  const reset = () => { setEmployeeId(""); setReason("RESIGNATION"); setLastDay(""); setNotes(""); };

  const canSubmit = employeeId && lastDay;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await start({ employeeId, reason, lastDay, notes: notes.trim() || undefined });
      toast.success(t.hr.offboarding.startSuccess);
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.hr.offboarding.startFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.hr.offboarding.startTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <SectionLabel htmlFor="off-emp">{t.hr.offboarding.employee}</SectionLabel>
            <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
              <SelectTrigger id="off-emp"><SelectValue placeholder={t.hr.offboarding.selectEmployee} /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstNameTh} {e.lastNameTh} ({e.employeeCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <SectionLabel htmlFor="off-reason">{t.hr.offboarding.reason}</SectionLabel>
            <Select value={reason} onValueChange={(v) => setReason(v as OffboardingReason)}>
              <SelectTrigger id="off-reason"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RESIGNATION">{t.hr.offboarding.reasons.RESIGNATION}</SelectItem>
                <SelectItem value="TERMINATION">{t.hr.offboarding.reasons.TERMINATION}</SelectItem>
                <SelectItem value="RETIREMENT">{t.hr.offboarding.reasons.RETIREMENT}</SelectItem>
                <SelectItem value="CONTRACT_END">{t.hr.offboarding.reasons.CONTRACT_END}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <SectionLabel htmlFor="off-last">{t.hr.offboarding.lastDay}</SectionLabel>
            <Input id="off-last" type="date" value={lastDay} onChange={(e) => setLastDay(e.target.value)} />
          </div>
          <div>
            <SectionLabel htmlFor="off-notes">{t.hr.offboarding.notes}</SectionLabel>
            <Textarea id="off-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? t.common.saving : t.hr.offboarding.startBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
