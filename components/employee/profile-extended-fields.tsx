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
  const str = (key: keyof Profile) => String(profile[key] ?? "");
  const dateFmt = (key: keyof Profile) => {
    const v = profile[key];
    if (!v) return "";
    return String(v).slice(0, 10);
  };

  // Personal
  const [nicknameTh, setNicknameTh] = useState(str("nicknameTh"));
  const [nicknameEn, setNicknameEn] = useState(str("nicknameEn"));
  const [dateOfBirth, setDateOfBirth] = useState(dateFmt("dateOfBirth"));
  const [nationality, setNationality] = useState(str("nationality"));
  const [religion, setReligion] = useState(str("religion"));
  const [maritalStatus, setMaritalStatus] = useState(str("maritalStatus"));
  const [bloodType, setBloodType] = useState(str("bloodType"));

  // Address
  const [addressCurrent, setAddressCurrent] = useState(str("addressCurrent"));
  const [provinceCurrent, setProvinceCurrent] = useState(str("provinceCurrent"));
  const [districtCurrent, setDistrictCurrent] = useState(str("districtCurrent"));
  const [zipCodeCurrent, setZipCodeCurrent] = useState(str("zipCodeCurrent"));

  // Financial
  const [bankName, setBankName] = useState(str("bankName"));
  const [bankAccount, setBankAccount] = useState(str("bankAccount"));

  // Emergency
  const [emergencyName, setEmergencyName] = useState(str("emergencyName"));
  const [emergencyLastName, setEmergencyLastName] = useState(str("emergencyLastName"));
  const [emergencyRelation, setEmergencyRelation] = useState(str("emergencyRelation"));
  const [emergencyPhone, setEmergencyPhone] = useState(str("emergencyPhone"));

  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setNicknameTh(str("nicknameTh"));
    setNicknameEn(str("nicknameEn"));
    setDateOfBirth(dateFmt("dateOfBirth"));
    setNationality(str("nationality"));
    setReligion(str("religion"));
    setMaritalStatus(str("maritalStatus"));
    setBloodType(str("bloodType"));
    setAddressCurrent(str("addressCurrent"));
    setProvinceCurrent(str("provinceCurrent"));
    setDistrictCurrent(str("districtCurrent"));
    setZipCodeCurrent(str("zipCodeCurrent"));
    setBankName(str("bankName"));
    setBankAccount(str("bankAccount"));
    setEmergencyName(str("emergencyName"));
    setEmergencyLastName(str("emergencyLastName"));
    setEmergencyRelation(str("emergencyRelation"));
    setEmergencyPhone(str("emergencyPhone"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const save = async (section: string, fields: Record<string, unknown>) => {
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
          <Field id="nicknameTh" label="Nickname (TH)" value={nicknameTh} onChange={setNicknameTh} />
          <Field id="nicknameEn" label="Nickname (EN)" value={nicknameEn} onChange={setNicknameEn} />
        </div>
        <Field id="dateOfBirth" label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
        <div className="grid grid-cols-2 gap-3">
          <Field id="nationality" label="Nationality" value={nationality} onChange={setNationality} />
          <Field id="religion" label="Religion" value={religion} onChange={setReligion} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="maritalStatus" label="Marital Status" value={maritalStatus} onChange={setMaritalStatus} />
          <Field id="bloodType" label="Blood Type" value={bloodType} onChange={setBloodType} />
        </div>
        <Button
          className="w-full" size="sm"
          disabled={saving === "personal"}
          onClick={() => save("personal", {
            nicknameTh: nicknameTh || undefined, nicknameEn: nicknameEn || undefined,
            dateOfBirth: dateOfBirth || undefined, nationality: nationality || undefined,
            religion: religion || undefined, maritalStatus: maritalStatus || undefined,
            bloodType: bloodType || undefined,
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
          <Textarea id="addressCurrent" value={addressCurrent} onChange={(e) => setAddressCurrent(e.target.value)} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="provinceCurrent" label="Province" value={provinceCurrent} onChange={setProvinceCurrent} />
          <Field id="districtCurrent" label="District" value={districtCurrent} onChange={setDistrictCurrent} />
        </div>
        <Field id="zipCodeCurrent" label="Zip Code" value={zipCodeCurrent} onChange={setZipCodeCurrent} />
        <Button
          className="w-full" size="sm"
          disabled={saving === "address"}
          onClick={() => save("address", {
            addressCurrent: addressCurrent || undefined, provinceCurrent: provinceCurrent || undefined,
            districtCurrent: districtCurrent || undefined, zipCodeCurrent: zipCodeCurrent || undefined,
          })}
        >
          {saving === "address" ? "Saving..." : "Save Address"}
        </Button>
      </div>

      {/* Financial */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
        <SectionTitle>การเงิน</SectionTitle>
        <Separator />
        <Field id="bankName" label="Bank Name" value={bankName} onChange={setBankName} />
        <Field id="bankAccount" label="Account Number" value={bankAccount} onChange={setBankAccount} />
        <Button
          className="w-full" size="sm"
          disabled={saving === "financial"}
          onClick={() => save("financial", { bankName: bankName || undefined, bankAccount: bankAccount || undefined })}
        >
          {saving === "financial" ? "Saving..." : "Save Financial Info"}
        </Button>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
        <SectionTitle>ผู้ติดต่อฉุกเฉิน</SectionTitle>
        <Separator />
        <div className="grid grid-cols-2 gap-3">
          <Field id="emergencyName" label="First Name" value={emergencyName} onChange={setEmergencyName} />
          <Field id="emergencyLastName" label="Last Name" value={emergencyLastName} onChange={setEmergencyLastName} />
        </div>
        <Field id="emergencyRelation" label="Relation" value={emergencyRelation} onChange={setEmergencyRelation} />
        <Field id="emergencyPhone" label="Phone" value={emergencyPhone} onChange={setEmergencyPhone} />
        <Button
          className="w-full" size="sm"
          disabled={saving === "emergency"}
          onClick={() => save("emergency", {
            emergencyName: emergencyName || undefined, emergencyLastName: emergencyLastName || undefined,
            emergencyRelation: emergencyRelation || undefined, emergencyPhone: emergencyPhone || undefined,
          })}
        >
          {saving === "emergency" ? "Saving..." : "Save Emergency Contact"}
        </Button>
      </div>
    </div>
  );
}
