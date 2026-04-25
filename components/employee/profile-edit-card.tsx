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

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PROBATION: "secondary",
  SUSPENDED: "destructive",
  RESIGNED: "outline",
};

export function ProfileEditCard() {
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
      toast.success("บันทึกเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-base">ข้อมูลของฉัน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Read-only fields */}
        <div className="space-y-1">
          <Label className="text-muted-foreground">รหัสพนักงาน</Label>
          <p className="text-sm font-medium">{profile.employeeCode}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-muted-foreground">ชื่อ (TH)</Label>
            <p className="text-sm font-medium">{profile.firstNameTh}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">นามสกุล (TH)</Label>
            <p className="text-sm font-medium">{profile.lastNameTh}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">อีเมล</Label>
          <p className="text-sm">{profile.user?.email ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">แผนก</Label>
          <p className="text-sm">{profile.department?.name ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">ตำแหน่ง</Label>
          <p className="text-sm">{profile.position?.name ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">สถานะ</Label>
          <Badge variant={statusVariant[profile.employmentStatus] ?? "outline"}>
            {profile.employmentStatus}
          </Badge>
        </div>

        {/* Editable fields */}
        <div className="space-y-1">
          <Label htmlFor="firstNameEn">ชื่อ (EN)</Label>
          <Input id="firstNameEn" value={firstNameEn} onChange={(e) => setFirstNameEn(e.target.value)} placeholder="English first name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastNameEn">นามสกุล (EN)</Label>
          <Input id="lastNameEn" value={lastNameEn} onChange={(e) => setLastNameEn(e.target.value)} placeholder="English last name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">เบอร์โทร</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0xx-xxx-xxxx" />
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </CardContent>
    </Card>
  );
}
