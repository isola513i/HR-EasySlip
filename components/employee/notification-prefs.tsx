"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";

interface NotificationSettings {
  notifyLeave: boolean;
  notifyApproval: boolean;
}

export function NotificationPrefs() {
  const t = useT();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<NotificationSettings>("/api/v1/employee/me/notifications")
      .then(setSettings)
      .catch(() => toast.error(t.common.loadFailed))
      .finally(() => setIsLoading(false));
  }, [t]);

  const toggle = async (key: keyof NotificationSettings) => {
    if (!settings) return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await apiFetch("/api/v1/employee/me/notifications", {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      toast.success(t.common.savedSuccess);
    } catch {
      setSettings(settings); // rollback
      toast.error(t.common.saveFailed);
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
      <p className="text-sm font-semibold">{t.notifications.title}</p>
      <div className="flex items-center gap-2.5">
        <Checkbox
          id="notifyLeave"
          checked={settings.notifyLeave}
          onCheckedChange={() => toggle("notifyLeave")}
        />
        <Label htmlFor="notifyLeave" className="text-sm">
          {t.notifications.leaveEmail}
        </Label>
      </div>
      <div className="flex items-center gap-2.5">
        <Checkbox
          id="notifyApproval"
          checked={settings.notifyApproval}
          onCheckedChange={() => toggle("notifyApproval")}
        />
        <Label htmlFor="notifyApproval" className="text-sm">
          {t.notifications.approvalEmail}
        </Label>
      </div>
    </div>
  );
}
