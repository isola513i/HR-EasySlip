"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";
import {
  detectPushSupport,
  getActiveSubscription,
  subscribePush,
  unsubscribePush,
  type PushSupport,
} from "@/lib/push/client";

interface NotificationSettings {
  notifyLeave: boolean;
  notifyApproval: boolean;
}

export function NotificationPrefs() {
  const t = useT();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pushSupport, setPushSupport] = useState<PushSupport>("unsupported");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    apiFetch<NotificationSettings>("/api/v1/employee/me/notifications")
      .then(setSettings)
      .catch(() => toast.error(t.common.loadFailed))
      .finally(() => setIsLoading(false));
  }, [t]);

  useEffect(() => {
    setPushSupport(detectPushSupport());
    getActiveSubscription().then((sub) => setPushEnabled(sub !== null));
  }, []);

  const togglePush = useCallback(async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await unsubscribePush();
        setPushEnabled(false);
      } else {
        await subscribePush();
        setPushEnabled(true);
      }
      toast.success(t.common.savedSuccess);
    } catch (err) {
      const code = err instanceof Error ? err.message : "PUSH_FAILED";
      const messages = t.notifications.push as Record<string, string>;
      toast.error(messages[code] ?? messages.failed);
      if (code === "PUSH_DENIED") setPushSupport("denied");
    } finally {
      setPushBusy(false);
    }
  }, [pushEnabled, t.common.savedSuccess, t.notifications.push]);

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
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-56" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-4">
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

      {pushSupport !== "unsupported" && (
        <div className="flex items-center gap-2.5 border-t border-border pt-3">
          <Checkbox
            id="notifyPush"
            checked={pushEnabled}
            disabled={pushBusy || pushSupport === "denied"}
            onCheckedChange={togglePush}
          />
          <Label htmlFor="notifyPush" className="text-sm">
            {t.notifications.push.label}
            {pushSupport === "denied" && (
              <span className="ml-2 text-[11px] text-destructive">
                {t.notifications.push.deniedHint}
              </span>
            )}
          </Label>
        </div>
      )}
    </div>
  );
}
