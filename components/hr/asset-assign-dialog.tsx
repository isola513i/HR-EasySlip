"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionLabel } from "@/components/shared/section-label";
import { apiFetch } from "@/lib/api/client";
import { useAssets } from "@/hooks/use-assets";
import { useT } from "@/lib/i18n/locale-context";

interface EmployeeOption {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
}

interface Props {
  open: boolean;
  assetId: string | null;
  assetLabel?: string;
  onClose: () => void;
}

export function AssetAssignDialog({ open, assetId, assetLabel, onClose }: Props) {
  const t = useT();
  const { assignAsset } = useAssets();
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiFetch<{ data: EmployeeOption[] }>("/api/v1/hr/employees?perPage=100&status=ACTIVE")
      .then((res) => setEmployees(Array.isArray(res) ? (res as unknown as EmployeeOption[]) : res.data))
      .catch(() => setEmployees([]));
  }, [open]);

  const handleSubmit = async () => {
    if (!assetId || !employeeId) return;
    setSubmitting(true);
    try {
      await assignAsset(assetId, employeeId);
      toast.success(t.hr.assets.assignSuccess);
      setEmployeeId("");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.hr.assets.assignFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.hr.assets.assignTitle}</DialogTitle>
        </DialogHeader>
        {assetLabel && (
          <div className="rounded-lg bg-muted px-3 py-2 text-[12px] text-muted-foreground">
            {assetLabel}
          </div>
        )}
        <div>
          <SectionLabel htmlFor="assign-employee">{t.hr.assets.employee}</SectionLabel>
          <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
            <SelectTrigger id="assign-employee" className="h-10 w-full">
              <SelectValue placeholder={t.hr.assets.selectEmployee} />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.firstNameTh} {e.lastNameTh} ({e.employeeCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} disabled={submitting || !employeeId}>
            {submitting ? t.common.saving : t.hr.assets.assignBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
