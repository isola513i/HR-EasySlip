"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onCreate: (input: Record<string, unknown>) => Promise<unknown>;
}

interface FormState {
  employeeCode: string;
  email: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  phone: string;
  hireDate: string;
  workShift: string;
}

const initial: FormState = {
  employeeCode: "", email: "", firstNameTh: "", lastNameTh: "",
  firstNameEn: "", lastNameEn: "", phone: "", hireDate: "", workShift: "MORNING",
};

export function EmployeeFormDialog({ open, onClose, onCreated, onCreate }: Props) {
  const t = useT();
  const [form, setForm] = useState<FormState>(initial);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeCode || !form.email || !form.firstNameTh || !form.lastNameTh || !form.hireDate) {
      setError(t.hr.requiredFields);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        employeeCode: form.employeeCode,
        email: form.email,
        firstNameTh: form.firstNameTh,
        lastNameTh: form.lastNameTh,
        hireDate: form.hireDate,
        workShift: form.workShift,
      };
      if (form.firstNameEn) body.firstNameEn = form.firstNameEn;
      if (form.lastNameEn) body.lastNameEn = form.lastNameEn;
      if (form.phone) body.phone = form.phone;

      const result = await onCreate(body) as { data?: { initialPassword?: string }; initialPassword?: string } | undefined;
      toast.success(t.hr.employeeCreated);

      const pwd = result?.data?.initialPassword ?? result?.initialPassword;
      if (pwd) {
        setCreatedPassword(pwd);
      }
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create employee";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdPassword) return;
    await navigator.clipboard.writeText(createdPassword);
    setCopied(true);
    toast.success(t.common.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClosePasswordDialog = () => {
    setCreatedPassword(null);
    setCopied(false);
    setForm(initial);
    onClose();
  };

  // Show initial password after successful creation
  if (createdPassword) {
    return (
      <Dialog open={open} onOpenChange={() => handleClosePasswordDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.password.initialPasswordTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t.password.initialPasswordInfo}
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <code className="flex-1 text-sm font-mono font-semibold">
                {createdPassword}
              </code>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={handleCopy}>
                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-destructive">
              {t.password.tempPasswordWarn}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleClosePasswordDialog} className="w-full">
              {t.password.tempPasswordClose}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.hr.addEmployeeTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="empCode">{t.hr.employeeCode} *</Label>
              <Input id="empCode" value={form.employeeCode} onChange={set("employeeCode")} placeholder="ES0001" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="empEmail">{t.profile.email} *</Label>
              <Input id="empEmail" type="email" value={form.email} onChange={set("email")} placeholder="name@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fnTh">{t.hr.firstNameTh} *</Label>
              <Input id="fnTh" value={form.firstNameTh} onChange={set("firstNameTh")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lnTh">{t.hr.lastNameTh} *</Label>
              <Input id="lnTh" value={form.lastNameTh} onChange={set("lastNameTh")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fnEn">{t.hr.firstNameEn}</Label>
              <Input id="fnEn" value={form.firstNameEn} onChange={set("firstNameEn")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lnEn">{t.hr.lastNameEn}</Label>
              <Input id="lnEn" value={form.lastNameEn} onChange={set("lastNameEn")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="empPhone">{t.profile.phone}</Label>
            <Input id="empPhone" value={form.phone} onChange={set("phone")} placeholder="0xx-xxx-xxxx" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="hireDate">{t.hr.hireDateLabel} *</Label>
              <Input id="hireDate" type="date" value={form.hireDate} onChange={set("hireDate")} />
            </div>
            <div className="space-y-1">
              <Label>{t.hr.workShift}</Label>
              <Select value={form.workShift} onValueChange={(v) => { if (v) setForm((p) => ({ ...p, workShift: v })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">{t.hr.morningShift}</SelectItem>
                  <SelectItem value="EVENING">{t.hr.eveningShift}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? t.hr.creating : t.hr.createEmployee}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
