"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ReadField } from "@/components/employee/me/read-field";
import { type Profile } from "@/hooks/use-profile";
import { useT } from "@/lib/i18n/locale-context";

interface PersonalInfoSectionProps {
  profile: Profile;
  onUpdate: (input: Partial<Profile>) => Promise<Profile>;
}

export function PersonalInfoSection({ profile, onUpdate }: PersonalInfoSectionProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstNameEn, setFirstNameEn] = useState("");
  const [lastNameEn, setLastNameEn] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [addressCurrent, setAddressCurrent] = useState("");

  useEffect(() => {
    setFirstNameEn(profile.firstNameEn ?? "");
    setLastNameEn(profile.lastNameEn ?? "");
    setPhone(profile.phone ?? "");
    setNationality(profile.nationality ?? "");
    setAddressCurrent(profile.addressCurrent ?? "");
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        firstNameEn: firstNameEn || undefined,
        lastNameEn: lastNameEn || undefined,
        phone: phone || undefined,
        nationality: nationality || undefined,
        addressCurrent: addressCurrent || undefined,
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
          <div className="col-span-2">
            <ReadField label={t.profile.email} value={profile.user?.email} />
          </div>
          <div className="col-span-2">
            <ReadField label={t.profile.addressLine} value={profile.addressCurrent} />
          </div>
          <div className="col-span-2">
            <ReadField label={t.profile.nationality} value={profile.nationality} />
          </div>
          <ReadField label={t.profile.firstNameEn} value={profile.firstNameEn} />
          <ReadField label={t.profile.lastNameEn} value={profile.lastNameEn} />
          <div className="col-span-2">
            <ReadField label={t.profile.phone} value={profile.phone} />
          </div>
        </div>
        <Button className="w-full rounded-full" size="lg" onClick={() => setEditing(true)}>
          {t.profile.openEdit}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="firstNameEn">{t.profile.firstNameEn}</Label>
          <Input id="firstNameEn" value={firstNameEn} onChange={(e) => setFirstNameEn(e.target.value)} placeholder={t.profile.firstNameEnPlaceholder} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastNameEn">{t.profile.lastNameEn}</Label>
          <Input id="lastNameEn" value={lastNameEn} onChange={(e) => setLastNameEn(e.target.value)} placeholder={t.profile.lastNameEnPlaceholder} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="phone">{t.profile.phone}</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.profile.phonePlaceholder} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="nationality">{t.profile.nationality}</Label>
        <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="addressCurrent">{t.profile.addressLine}</Label>
        <Textarea id="addressCurrent" rows={2} value={addressCurrent} onChange={(e) => setAddressCurrent(e.target.value)} />
      </div>
      <div className="flex gap-2">
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
