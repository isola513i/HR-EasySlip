"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPrefs } from "@/components/employee/notification-prefs";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { ChangePasswordDialog } from "@/components/employee/change-password-dialog";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  user: { name: string; code: string; role: string; email: string };
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-[13px] text-foreground">{value || "—"}</span>
    </div>
  );
}

export function ManagerSettingsView({ user }: Props) {
  const t = useT();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.manager.nav.settings}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <SettingsCard title={t.manager.settingsAccount}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <ReadField label={t.profile.myInfo} value={user.name} />
              <ReadField label={t.profile.employeeCode} value={user.code} />
              <ReadField label={t.profile.email} value={user.email} />
              <ReadField label={t.hr.role} value={user.role} />
            </div>
          </SettingsCard>

          <SettingsCard title={t.manager.settingsSecurity}>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setShowChangePassword(true)}
              >
                <KeyRound className="size-4" />
                {t.password.changeButton}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => signOut({ callbackUrl: "/signin" })}
              >
                <LogOut className="size-4" />
                {t.common.signOut}
              </Button>
            </div>
          </SettingsCard>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <SettingsCard title={t.notifications.title}>
            <NotificationPrefs />
          </SettingsCard>

          <SettingsCard title={t.common.language}>
            <LocaleToggle />
          </SettingsCard>
        </div>
      </div>

      <ChangePasswordDialog
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}
