"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { useT } from "@/lib/i18n/locale-context";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PROBATION: "secondary",
  SUSPENDED: "destructive",
  RESIGNED: "outline",
};

export function ProfileEditCard() {
  const t = useT();
  const { profile, isLoading, error, updateProfile } = useProfile();
  const [phone, setPhone] = useState("");
  const [firstNameEn, setFirstNameEn] = useState("");
  const [lastNameEn, setLastNameEn] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPhone(profile.phone ?? "");
    setFirstNameEn(profile.firstNameEn ?? "");
    setLastNameEn(profile.lastNameEn ?? "");
  }, [profile]);

  if (isLoading) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-6 text-center text-sm text-destructive">
          {error ?? "Profile not found"}
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ phone: phone || undefined, firstNameEn: firstNameEn || undefined, lastNameEn: lastNameEn || undefined });
      toast.success(t.common.savedSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-base">{t.profile.myInfo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Read-only fields */}
        <div className="space-y-1">
          <Label className="text-muted-foreground">{t.profile.employeeCode}</Label>
          <p className="text-sm font-medium">{profile.employeeCode}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-muted-foreground">{t.profile.firstNameTh}</Label>
            <p className="text-sm font-medium">{profile.firstNameTh}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">{t.profile.lastNameTh}</Label>
            <p className="text-sm font-medium">{profile.lastNameTh}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">{t.profile.email}</Label>
          <p className="text-sm">{profile.user?.email ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">{t.profile.department}</Label>
          <p className="text-sm">{profile.department?.name ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">{t.profile.position}</Label>
          <p className="text-sm">{profile.position?.name ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">{t.profile.status}</Label>
          <Badge variant={statusVariant[profile.employmentStatus] ?? "outline"}>
            {profile.employmentStatus}
          </Badge>
        </div>

        {/* Editable fields */}
        <div className="space-y-1">
          <Label htmlFor="firstNameEn">{t.profile.firstNameEn}</Label>
          <Input id="firstNameEn" value={firstNameEn} onChange={(e) => setFirstNameEn(e.target.value)} placeholder={t.profile.firstNameEnPlaceholder} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastNameEn">{t.profile.lastNameEn}</Label>
          <Input id="lastNameEn" value={lastNameEn} onChange={(e) => setLastNameEn(e.target.value)} placeholder={t.profile.lastNameEnPlaceholder} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">{t.profile.phone}</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.profile.phonePlaceholder} />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? t.common.saving : t.common.save}
        </Button>
      </CardContent>
    </Card>
  );
}
