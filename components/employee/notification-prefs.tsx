"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

interface NotificationSettings {
  notifyLeave: boolean;
  notifyApproval: boolean;
}

export function NotificationPrefs() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<NotificationSettings>("/api/v1/employee/me/notifications")
      .then(setSettings)
      .catch(() => toast.error("โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = async (key: keyof NotificationSettings) => {
    if (!settings) return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await apiFetch("/api/v1/employee/me/notifications", {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      toast.success("บันทึกเรียบร้อย");
    } catch {
      setSettings(settings); // rollback
      toast.error("บันทึกไม่สำเร็จ");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-56" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
      <p className="text-sm font-semibold">Notifications</p>
      <div className="flex items-center gap-2.5">
        <Checkbox
          id="notifyLeave"
          checked={settings.notifyLeave}
          onCheckedChange={() => toggle("notifyLeave")}
        />
        <Label htmlFor="notifyLeave" className="text-sm">
          Send email when there is a new leave request
        </Label>
      </div>
      <div className="flex items-center gap-2.5">
        <Checkbox
          id="notifyApproval"
          checked={settings.notifyApproval}
          onCheckedChange={() => toggle("notifyApproval")}
        />
        <Label htmlFor="notifyApproval" className="text-sm">
          Send email when a request is approved/rejected
        </Label>
      </div>
    </div>
  );
}
