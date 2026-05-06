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

interface AddressSectionProps {
  profile: Profile;
  onUpdate: (input: Partial<Profile>) => Promise<Profile>;
}

export function AddressSection({ profile, onUpdate }: AddressSectionProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressCurrent, setAddressCurrent] = useState("");
  const [provinceCurrent, setProvinceCurrent] = useState("");
  const [districtCurrent, setDistrictCurrent] = useState("");
  const [zipCodeCurrent, setZipCodeCurrent] = useState("");

  useEffect(() => {
    setAddressCurrent(profile.addressCurrent ?? "");
    setProvinceCurrent(profile.provinceCurrent ?? "");
    setDistrictCurrent(profile.districtCurrent ?? "");
    setZipCodeCurrent(profile.zipCodeCurrent ?? "");
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        addressCurrent: addressCurrent || undefined,
        provinceCurrent: provinceCurrent || undefined,
        districtCurrent: districtCurrent || undefined,
        zipCodeCurrent: zipCodeCurrent || undefined,
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
          <div className="col-span-2">
            <ReadField label={t.profile.addressLine} value={profile.addressCurrent} />
          </div>
          <ReadField label={t.profile.province} value={profile.provinceCurrent} />
          <ReadField label={t.profile.district} value={profile.districtCurrent} />
          <div className="col-span-2">
            <ReadField label={t.profile.zipCode} value={profile.zipCodeCurrent} />
          </div>
        </div>
        <Button className="w-full rounded-full" size="lg" onClick={() => setEditing(true)}>
          {t.profile.openEdit}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="addressCurrent">{t.profile.addressLine}</Label>
        <Textarea id="addressCurrent" rows={2} value={addressCurrent} onChange={(e) => setAddressCurrent(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="provinceCurrent">{t.profile.province}</Label>
          <Input id="provinceCurrent" className="h-11" value={provinceCurrent} onChange={(e) => setProvinceCurrent(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="districtCurrent">{t.profile.district}</Label>
          <Input id="districtCurrent" className="h-11" value={districtCurrent} onChange={(e) => setDistrictCurrent(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="zipCodeCurrent">{t.profile.zipCode}</Label>
        <Input id="zipCodeCurrent" className="h-11" value={zipCodeCurrent} onChange={(e) => setZipCodeCurrent(e.target.value)} />
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
