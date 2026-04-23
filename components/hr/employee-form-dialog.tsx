"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api/client";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
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

export function EmployeeFormDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initial);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeCode || !form.email || !form.firstNameTh || !form.lastNameTh || !form.hireDate) {
      setError("Please fill in all required fields");
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

      await apiFetch("/api/v1/hr/employees", { method: "POST", body: JSON.stringify(body) });
      toast.success("Employee created");
      setForm(initial);
      onCreated();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create employee";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="empCode">Employee Code *</Label>
              <Input id="empCode" value={form.employeeCode} onChange={set("employeeCode")} placeholder="ES0001" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="empEmail">Email *</Label>
              <Input id="empEmail" type="email" value={form.email} onChange={set("email")} placeholder="name@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fnTh">First Name (TH) *</Label>
              <Input id="fnTh" value={form.firstNameTh} onChange={set("firstNameTh")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lnTh">Last Name (TH) *</Label>
              <Input id="lnTh" value={form.lastNameTh} onChange={set("lastNameTh")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fnEn">First Name (EN)</Label>
              <Input id="fnEn" value={form.firstNameEn} onChange={set("firstNameEn")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lnEn">Last Name (EN)</Label>
              <Input id="lnEn" value={form.lastNameEn} onChange={set("lastNameEn")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="empPhone">Phone</Label>
            <Input id="empPhone" value={form.phone} onChange={set("phone")} placeholder="0xx-xxx-xxxx" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="hireDate">Hire Date *</Label>
              <Input id="hireDate" type="date" value={form.hireDate} onChange={set("hireDate")} />
            </div>
            <div className="space-y-1">
              <Label>Work Shift</Label>
              <Select value={form.workShift} onValueChange={(v) => { if (v) setForm((p) => ({ ...p, workShift: v })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">Morning</SelectItem>
                  <SelectItem value="EVENING">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
