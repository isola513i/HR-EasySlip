"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Profile } from "@/hooks/use-profile";

interface Props {
  profile: Profile;
  onSave: (fields: Partial<Profile>) => Promise<void>;
}

interface FormState {
  nicknameTh: string;
  nicknameEn: string;
  dateOfBirth: string;
  nationality: string;
  religion: string;
  maritalStatus: string;
  bloodType: string;
  addressCurrent: string;
  provinceCurrent: string;
  districtCurrent: string;
  zipCodeCurrent: string;
  bankName: string;
  bankAccount: string;
  emergencyName: string;
  emergencyLastName: string;
  emergencyRelation: string;
  emergencyPhone: string;
}

type SavingSection = "personal" | "address" | "financial" | "emergency" | null;

function initialFromProfile(profile: Profile): FormState {
  const str = (key: keyof Profile) => String(profile[key] ?? "");
  const dateFmt = (key: keyof Profile) => {
    const v = profile[key];
    return v ? String(v).slice(0, 10) : "";
  };
  return {
    nicknameTh: str("nicknameTh"),
    nicknameEn: str("nicknameEn"),
    dateOfBirth: dateFmt("dateOfBirth"),
    nationality: str("nationality"),
    religion: str("religion"),
    maritalStatus: str("maritalStatus"),
    bloodType: str("bloodType"),
    addressCurrent: str("addressCurrent"),
    provinceCurrent: str("provinceCurrent"),
    districtCurrent: str("districtCurrent"),
    zipCodeCurrent: str("zipCodeCurrent"),
    bankName: str("bankName"),
    bankAccount: str("bankAccount"),
    emergencyName: str("emergencyName"),
    emergencyLastName: str("emergencyLastName"),
    emergencyRelation: str("emergencyRelation"),
    emergencyPhone: str("emergencyPhone"),
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold">{children}</h3>;
}

function Field({ id, label, value, onChange, type = "text" }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function ProfileExtendedFields({ profile, onSave }: Props) {
  const [form, setForm] = useState<FormState>(initialFromProfile(profile));
  const [saving, setSaving] = useState<SavingSection>(null);

  const set = (key: keyof FormState) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  useEffect(() => {
    setForm(initialFromProfile(profile));
  }, [profile]);

  const save = async (section: SavingSection, fields: Record<string, unknown>) => {
    setSaving(section);
    try { await onSave(fields); } finally { setSaving(null); }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Personal */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
        <SectionTitle>ข้อมูลส่วนตัว</SectionTitle>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <Field id="nicknameTh" label="Nickname (TH)" value={form.nicknameTh} onChange={set("nicknameTh")} />
          <Field id="nicknameEn" label="Nickname (EN)" value={form.nicknameEn} onChange={set("nicknameEn")} />
        </div>
        <Field id="dateOfBirth" label="Date of Birth" value={form.dateOfBirth} onChange={set("dateOfBirth")} type="date" />
        <div className="grid grid-cols-2 gap-3">
          <Field id="nationality" label="Nationality" value={form.nationality} onChange={set("nationality")} />
          <Field id="religion" label="Religion" value={form.religion} onChange={set("religion")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="maritalStatus" label="Marital Status" value={form.maritalStatus} onChange={set("maritalStatus")} />
          <Field id="bloodType" label="Blood Type" value={form.bloodType} onChange={set("bloodType")} />
        </div>
        <Button
          className="w-full" size="sm"
          disabled={saving === "personal"}
          onClick={() => save("personal", {
            nicknameTh: form.nicknameTh || undefined, nicknameEn: form.nicknameEn || undefined,
            dateOfBirth: form.dateOfBirth || undefined, nationality: form.nationality || undefined,
            religion: form.religion || undefined, maritalStatus: form.maritalStatus || undefined,
            bloodType: form.bloodType || undefined,
          })}
        >
          {saving === "personal" ? "Saving..." : "Save Personal Info"}
        </Button>
      </div>

      {/* Address */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
        <SectionTitle>ที่อยู่ปัจจุบัน</SectionTitle>
        <Separator />
        <div className="space-y-1">
          <Label htmlFor="addressCurrent">Address</Label>
          <Textarea id="addressCurrent" value={form.addressCurrent} onChange={(e) => set("addressCurrent")(e.target.value)} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="provinceCurrent" label="Province" value={form.provinceCurrent} onChange={set("provinceCurrent")} />
          <Field id="districtCurrent" label="District" value={form.districtCurrent} onChange={set("districtCurrent")} />
        </div>
        <Field id="zipCodeCurrent" label="Zip Code" value={form.zipCodeCurrent} onChange={set("zipCodeCurrent")} />
        <Button
          className="w-full" size="sm"
          disabled={saving === "address"}
          onClick={() => save("address", {
            addressCurrent: form.addressCurrent || undefined, provinceCurrent: form.provinceCurrent || undefined,
            districtCurrent: form.districtCurrent || undefined, zipCodeCurrent: form.zipCodeCurrent || undefined,
          })}
        >
          {saving === "address" ? "Saving..." : "Save Address"}
        </Button>
      </div>

      {/* Financial */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
        <SectionTitle>การเงิน</SectionTitle>
        <Separator />
        <Field id="bankName" label="Bank Name" value={form.bankName} onChange={set("bankName")} />
        <Field id="bankAccount" label="Account Number" value={form.bankAccount} onChange={set("bankAccount")} />
        <Button
          className="w-full" size="sm"
          disabled={saving === "financial"}
          onClick={() => save("financial", { bankName: form.bankName || undefined, bankAccount: form.bankAccount || undefined })}
        >
          {saving === "financial" ? "Saving..." : "Save Financial Info"}
        </Button>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
        <SectionTitle>ผู้ติดต่อฉุกเฉิน</SectionTitle>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <Field id="emergencyName" label="First Name" value={form.emergencyName} onChange={set("emergencyName")} />
          <Field id="emergencyLastName" label="Last Name" value={form.emergencyLastName} onChange={set("emergencyLastName")} />
        </div>
        <Field id="emergencyRelation" label="Relation" value={form.emergencyRelation} onChange={set("emergencyRelation")} />
        <Field id="emergencyPhone" label="Phone" value={form.emergencyPhone} onChange={set("emergencyPhone")} />
        <Button
          className="w-full" size="sm"
          disabled={saving === "emergency"}
          onClick={() => save("emergency", {
            emergencyName: form.emergencyName || undefined, emergencyLastName: form.emergencyLastName || undefined,
            emergencyRelation: form.emergencyRelation || undefined, emergencyPhone: form.emergencyPhone || undefined,
          })}
        >
          {saving === "emergency" ? "Saving..." : "Save Emergency Contact"}
        </Button>
      </div>
    </div>
  );
}
