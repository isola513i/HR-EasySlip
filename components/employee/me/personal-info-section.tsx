"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { ReadField } from "@/components/employee/me/read-field";
import { type Profile } from "@/hooks/use-profile";
import { useT } from "@/lib/i18n/locale-context";

interface PersonalInfoSectionProps {
  profile: Profile;
  onUpdate: (input: Partial<Profile>) => Promise<Profile>;
}

interface FormState {
  firstNameEn: string;
  lastNameEn: string;
  phone: string;
  nationality: string;
  nicknameTh: string;
  nicknameEn: string;
  dateOfBirth: string;
  religion: string;
  maritalStatus: string;
  bloodType: string;
}

function initial(profile: Profile): FormState {
  const dob = profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "";
  return {
    firstNameEn: profile.firstNameEn ?? "",
    lastNameEn: profile.lastNameEn ?? "",
    phone: profile.phone ?? "",
    nationality: profile.nationality ?? "",
    nicknameTh: profile.nicknameTh ?? "",
    nicknameEn: profile.nicknameEn ?? "",
    dateOfBirth: dob,
    religion: profile.religion ?? "",
    maritalStatus: profile.maritalStatus ?? "",
    bloodType: profile.bloodType ?? "",
  };
}

export function PersonalInfoSection({ profile, onUpdate }: PersonalInfoSectionProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() => initial(profile));

  useEffect(() => { setForm(initial(profile)); }, [profile]);

  const set = <K extends keyof FormState>(key: K) => (v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        firstNameEn: form.firstNameEn || undefined,
        lastNameEn: form.lastNameEn || undefined,
        phone: form.phone || undefined,
        nationality: form.nationality || undefined,
        nicknameTh: form.nicknameTh || undefined,
        nicknameEn: form.nicknameEn || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        religion: form.religion || undefined,
        maritalStatus: form.maritalStatus || undefined,
        bloodType: form.bloodType || undefined,
      });
      toast.success(t.profile.updateSuccess);
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.profile.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <ReadField label={t.profile.firstNameTh} value={profile.firstNameTh} />
          <ReadField label={t.profile.lastNameTh} value={profile.lastNameTh} />
          <ReadField label={t.profile.nicknameTh} value={profile.nicknameTh} />
          <ReadField label={t.profile.nicknameEn} value={profile.nicknameEn} />
          <div className="col-span-2">
            <ReadField label={t.profile.email} value={profile.user?.email} />
          </div>
          <ReadField label={t.profile.firstNameEn} value={profile.firstNameEn} />
          <ReadField label={t.profile.lastNameEn} value={profile.lastNameEn} />
          <div className="col-span-2">
            <ReadField label={t.profile.phone} value={profile.phone} />
          </div>
          <ReadField label={t.profile.dateOfBirth} value={form.dateOfBirth || undefined} />
          <ReadField label={t.profile.nationality} value={profile.nationality} />
          <ReadField label={t.profile.religion} value={profile.religion} />
          <ReadField label={t.profile.maritalStatus} value={profile.maritalStatus} />
          <ReadField label={t.profile.bloodType} value={profile.bloodType} />
        </div>
        <Button className="w-full rounded-full" size="lg" onClick={() => setEditing(true)}>
          {t.profile.openEdit}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field id="firstNameEn" label={t.profile.firstNameEn} value={form.firstNameEn} onChange={set("firstNameEn")} placeholder={t.profile.firstNameEnPlaceholder} />
        <Field id="lastNameEn" label={t.profile.lastNameEn} value={form.lastNameEn} onChange={set("lastNameEn")} placeholder={t.profile.lastNameEnPlaceholder} />
        <Field id="nicknameTh" label={t.profile.nicknameTh} value={form.nicknameTh} onChange={set("nicknameTh")} />
        <Field id="nicknameEn" label={t.profile.nicknameEn} value={form.nicknameEn} onChange={set("nicknameEn")} />
      </div>
      <Field id="phone" label={t.profile.phone} value={form.phone} onChange={set("phone")} placeholder={t.profile.phonePlaceholder} />
      <div className="space-y-1">
        <Label htmlFor="dateOfBirth">{t.profile.dateOfBirth}</Label>
        <DatePicker value={form.dateOfBirth} onChange={set("dateOfBirth")} className="h-11 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field id="nationality" label={t.profile.nationality} value={form.nationality} onChange={set("nationality")} />
        <Field id="religion" label={t.profile.religion} value={form.religion} onChange={set("religion")} />
        <Field id="maritalStatus" label={t.profile.maritalStatus} value={form.maritalStatus} onChange={set("maritalStatus")} />
        <Field id="bloodType" label={t.profile.bloodType} value={form.bloodType} onChange={set("bloodType")} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1 rounded-full" onClick={() => setEditing(false)} disabled={saving}>
          {t.common.cancel}
        </Button>
        <Button className="flex-1 rounded-full" onClick={handleSave} disabled={saving}>
          {saving ? t.common.saving : t.common.save}
        </Button>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, placeholder }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11" />
    </div>
  );
}
