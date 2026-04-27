"use client";

import { useState } from "react";
import {
  FileText,
  CalendarDays,
  ShieldCheck,
  KeyRound,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { StatusPill } from "@/components/shared/status-pill";
import { signOut } from "next-auth/react";
import { ProfileEditCard } from "@/components/employee/profile-edit-card";
import { ProfileExtendedFields } from "@/components/employee/profile-extended-fields";
import { NotificationPrefs } from "@/components/employee/notification-prefs";
import { useProfile } from "@/hooks/use-profile";
import { ChangePasswordDialog } from "@/components/employee/change-password-dialog";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  user: { name: string; code: string; role: string; email: string };
}

export function MeScreen({ user }: Props) {
  const t = useT();
  const { profile, updateProfile } = useProfile();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const menuItems = [
    { icon: FileText, label: t.employee.timesheet, sub: t.employee.timesheetDesc },
    { icon: CalendarDays, label: t.leave.leaveHistory, sub: t.leave.leaveHistoryDesc },
    { icon: ShieldCheck, label: t.profile.pdpaConsent, sub: t.profile.pdpaConsentDesc },
  ] as const;

  const handleExtendedSave = async (fields: Partial<typeof profile & object>) => {
    try {
      await updateProfile(fields);
      toast.success(t.profile.updateSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.profile.updateFailed);
    }
  };

  return (
    <>
      <header className="flex h-14 items-center border-b border-[var(--es-neutral-100)] px-4">
        <span className="text-base font-semibold">{t.profile.title}</span>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* User card */}
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
          <div className="es-brand-gradient grid size-14 shrink-0 place-items-center rounded-full text-[22px] font-bold text-white">
            {user.name.charAt(0) || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold">{user.name || "User"}</div>
            <div className="text-xs text-muted-foreground">{user.email || "—"}</div>
            <div className="mt-1">
              <StatusPill tone="neutral" dot={false}>
                {user.role} · {user.code}
              </StatusPill>
            </div>
          </div>
        </div>

        {/* Profile edit */}
        <ProfileEditCard />

        {/* Extended profile fields */}
        {profile && (
          <ProfileExtendedFields profile={profile} onSave={handleExtendedSave} />
        )}

        {/* Notification preferences */}
        <NotificationPrefs />

        {/* Menu */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--es-shadow-sm)]">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-muted ${
                i < menuItems.length - 1 ? "border-b border-[var(--es-neutral-100)]" : ""
              }`}
            >
              <item.icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">{item.sub}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}

          {/* Change password */}
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex w-full items-center gap-3.5 border-t border-[var(--es-neutral-100)] px-4 py-3.5 text-left transition-colors hover:bg-muted"
          >
            <KeyRound className="size-5 text-muted-foreground" strokeWidth={1.75} />
            <div className="flex-1">
              <div className="text-sm font-medium">{t.password.changeButton}</div>
              <div className="text-[11px] text-muted-foreground">{t.password.updateYourPassword}</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="flex w-full items-center gap-3.5 border-t border-[var(--es-neutral-100)] px-4 py-3.5 text-left text-destructive transition-colors hover:bg-[var(--es-error-50)]"
          >
            <LogOut className="size-5" strokeWidth={1.75} />
            <div className="flex-1">
              <div className="text-sm font-medium">{t.common.signOut}</div>
            </div>
          </button>
        </div>

        <div className="mt-2 text-center text-[11px] text-muted-foreground">
          {process.env.NEXT_PUBLIC_APP_NAME ?? "EasySlip HR"}
        </div>
      </div>

      <ChangePasswordDialog
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </>
  );
}
