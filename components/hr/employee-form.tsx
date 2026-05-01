"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/i18n/locale-context";

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

interface Props {
  onCreate: (input: Record<string, unknown>) => Promise<unknown>;
  onSuccess: (initialPassword: string | null) => void;
  cancelHref?: string;
}

export function EmployeeForm({ onCreate, onSuccess, cancelHref }: Props) {
  const t = useT();
  const [form, setForm] = useState<FormState>(initial);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const pwd = result?.data?.initialPassword ?? result?.initialPassword ?? null;
      onSuccess(pwd);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create employee";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="empCode">{t.hr.employeeCode} *</Label>
          <Input id="empCode" value={form.employeeCode} onChange={set("employeeCode")} placeholder={t.hr.employeeCodePlaceholder} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="empEmail">{t.profile.email} *</Label>
          <Input id="empEmail" type="email" value={form.email} onChange={set("email")} placeholder={t.signin.emailPlaceholder} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fnTh">{t.hr.firstNameTh} *</Label>
          <Input id="fnTh" value={form.firstNameTh} onChange={set("firstNameTh")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lnTh">{t.hr.lastNameTh} *</Label>
          <Input id="lnTh" value={form.lastNameTh} onChange={set("lastNameTh")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fnEn">{t.hr.firstNameEn}</Label>
          <Input id="fnEn" value={form.firstNameEn} onChange={set("firstNameEn")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lnEn">{t.hr.lastNameEn}</Label>
          <Input id="lnEn" value={form.lastNameEn} onChange={set("lastNameEn")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="empPhone">{t.profile.phone}</Label>
          <Input id="empPhone" value={form.phone} onChange={set("phone")} placeholder={t.profile.phonePlaceholder} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hireDate">{t.hr.hireDateLabel} *</Label>
          <DatePicker
            value={form.hireDate}
            onChange={(v) => setForm((p) => ({ ...p, hireDate: v }))}
            placeholder={t.common.selectDate}
            className="w-full"
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t.hr.workShift}</Label>
          <Select value={form.workShift} onValueChange={(v) => { if (v) setForm((p) => ({ ...p, workShift: v })); }}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue>{(value) => value === "EVENING" ? t.hr.eveningShift : t.hr.morningShift}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MORNING">{t.hr.morningShift}</SelectItem>
              <SelectItem value="EVENING">{t.hr.eveningShift}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {cancelHref && (
          <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
            {t.common.cancel}
          </Link>
        )}
        <Button type="submit" disabled={isLoading} className="sm:min-w-[160px]">
          {isLoading ? t.hr.creating : t.hr.createEmployee}
        </Button>
      </div>
    </form>
  );
}
