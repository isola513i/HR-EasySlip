"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReadField } from "@/components/employee/me/read-field";
import { type Profile } from "@/hooks/use-profile";
import { useT } from "@/lib/i18n/locale-context";

interface EmergencyContactSectionProps {
  profile: Profile;
  onUpdate: (input: Partial<Profile>) => Promise<Profile>;
}

export function EmergencyContactSection({ profile, onUpdate }: EmergencyContactSectionProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setName(profile.emergencyName ?? "");
    setLastName(profile.emergencyLastName ?? "");
    setRelation(profile.emergencyRelation ?? "");
    setPhone(profile.emergencyPhone ?? "");
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        emergencyName: name || undefined,
        emergencyLastName: lastName || undefined,
        emergencyRelation: relation || undefined,
        emergencyPhone: phone || undefined,
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
          <ReadField label={t.profile.emergencyFirstName} value={profile.emergencyName} />
          <ReadField label={t.profile.emergencyLastName} value={profile.emergencyLastName} />
          <ReadField label={t.profile.emergencyRelation} value={profile.emergencyRelation} />
          <ReadField label={t.profile.emergencyPhone} value={profile.emergencyPhone} />
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
        <div className="space-y-1">
          <Label htmlFor="emergencyName">{t.profile.emergencyFirstName}</Label>
          <Input id="emergencyName" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="emergencyLastName">{t.profile.emergencyLastName}</Label>
          <Input id="emergencyLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="emergencyRelation">{t.profile.emergencyRelation}</Label>
        <Input id="emergencyRelation" value={relation} onChange={(e) => setRelation(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="emergencyPhone">{t.profile.emergencyPhone}</Label>
        <Input id="emergencyPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
