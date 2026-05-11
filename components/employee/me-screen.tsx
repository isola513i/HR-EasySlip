"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/shared/profile-header";
import { Accordion, AccordionItem } from "@/components/shared/accordion";
import { ChangePasswordDialog } from "@/components/employee/change-password-dialog";
import { NotificationPrefs } from "@/components/employee/notification-prefs";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { PersonalInfoSection } from "@/components/employee/me/personal-info-section";
import { AddressSection } from "@/components/employee/me/address-section";
import { JobInfoSection } from "@/components/employee/me/job-info-section";
import { EmergencyContactSection } from "@/components/employee/me/emergency-contact-section";
import { MeLinkItem } from "@/components/employee/me/me-link-item";
import { SignOutButton } from "@/components/employee/me/sign-out-button";
import { ChangePasswordButton } from "@/components/employee/me/change-password-button";
import { ProfilePictureUploader } from "@/components/employee/me/profile-picture-uploader";
import { DocumentsSection } from "@/components/employee/me/documents-section";
import { CashoutSection } from "@/components/employee/me/cashout-section";
import { AssetsSection } from "@/components/employee/me/assets-section";
import { useProfile } from "@/hooks/use-profile";
import { profilePictureSrc } from "@/hooks/use-profile-picture";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useT } from "@/lib/i18n/locale-context";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

interface Props {
  user: { name: string; code: string; role: string; email: string };
}

export function MeScreen({ user }: Props) {
  const t = useT();
  const { profile, updateProfile, refetch } = useProfile();
  const { checklist } = useOnboarding();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pictureTick, setPictureTick] = useState(0);

  const showOnboardingBanner =
    checklist !== null &&
    checklist.completedAt === null &&
    checklist.progress.done < checklist.progress.total;

  const handlePictureChanged = () => {
    setPictureTick((v) => v + 1);
    void refetch();
  };

  const pictureSrc = profile?.hasProfilePicture
    ? profilePictureSrc(profile.id, profile.profilePictureUploadedAt, pictureTick)
    : null;

  return (
    <>
      <header className="flex h-14 items-center border-b border-[var(--es-neutral-100)] px-4">
        <span className="text-base font-semibold">{t.profile.title}</span>
      </header>

      <div className="flex flex-col gap-3 p-4">
        <ProfileHeader
          name={user.name}
          meta={`${user.role} · ${user.code}`}
          pictureSrc={pictureSrc}
          avatarOverlay={
            <ProfilePictureUploader
              hasPicture={!!profile?.hasProfilePicture}
              onChanged={handlePictureChanged}
            />
          }
        />

        {showOnboardingBanner && (
          <Link
            href="/employee/onboarding"
            className="flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--es-accent-200)] bg-[var(--es-accent-50)] px-4 py-3.5 transition-colors active:bg-[var(--es-accent-100)]"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--es-accent-100)]">
              <ClipboardList className="size-5 text-[var(--es-accent-700)]" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--es-accent-800)]">
                {t.onboarding.checklistTitle}
              </div>
              <div className="text-[11px] text-[var(--es-accent-600)]">
                {t.onboarding.bannerMessage.replace("{count}", String(checklist.progress.total - checklist.progress.done))}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[11px] font-semibold tabular-nums text-[var(--es-accent-700)]">
                {checklist.progress.done}/{checklist.progress.total}
              </div>
              <div className="mt-0.5 h-1 w-12 overflow-hidden rounded-full bg-[var(--es-accent-200)]">
                <div
                  className="h-full rounded-full bg-[var(--es-accent-600)] transition-all"
                  style={{ width: `${checklist.progress.percent}%` }}
                />
              </div>
            </div>
          </Link>
        )}

        <Accordion>
          {profile && (
            <AccordionItem title={t.profile.personalInfo}>
              <PersonalInfoSection profile={profile} onUpdate={updateProfile} />
            </AccordionItem>
          )}

          {profile && (
            <AccordionItem title={t.profile.address}>
              <AddressSection profile={profile} onUpdate={updateProfile} />
            </AccordionItem>
          )}

          {profile && (
            <AccordionItem title={t.profile.jobInfo}>
              <JobInfoSection profile={profile} />
            </AccordionItem>
          )}

          {profile && (
            <AccordionItem title={t.profile.emergency}>
              <EmergencyContactSection profile={profile} onUpdate={updateProfile} />
            </AccordionItem>
          )}

          {profile && (
            <AccordionItem title={t.documents.title}>
              <DocumentsSection employeeId={profile.id} />
            </AccordionItem>
          )}

          <AccordionItem title={t.profile.cashout.title}>
            <CashoutSection />
          </AccordionItem>

          <AccordionItem title={t.profile.assets.title}>
            <AssetsSection />
          </AccordionItem>

          <AccordionItem title={t.notifications.title} defaultOpen>
            <NotificationPrefs />
          </AccordionItem>
        </Accordion>

<div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--es-shadow-xs)]">
          <span className="text-sm font-semibold text-foreground">{t.common.language}</span>
          <div className="w-28">
            <LocaleToggle />
          </div>
        </div>

        <MeLinkItem label={t.profile.pdpaConsent} href="/privacy" />

<div className="mt-2 flex gap-3">
          <ChangePasswordButton onClick={() => setShowChangePassword(true)} />
          <SignOutButton />
        </div>

        <div className="mt-1 text-center text-[11px] text-muted-foreground">
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
