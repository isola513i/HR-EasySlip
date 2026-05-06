"use client";

import { Users } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { WelcomeHero } from "@/components/shared/welcome-hero";
import { FeatureList } from "@/components/shared/feature-list";
import { InfoBanner } from "@/components/shared/info-banner";

export function OnboardingWelcome() {
  const t = useT();
  const features = [
    { title: t.onboarding.attendanceFeature, description: t.onboarding.attendanceDesc },
    { title: t.onboarding.leaveFeature, description: t.onboarding.leaveDesc },
    { title: t.onboarding.profileFeature, description: t.onboarding.profileDesc },
  ];
  return (
    <div className="flex flex-col gap-6">
      <WelcomeHero
        icon={Users}
        title={t.onboarding.welcomeTitle}
        subtitle={t.onboarding.welcomeSubtitle}
      />
      <div className="space-y-3">
        <p className="text-sm font-bold text-foreground">{t.onboarding.usedFor}</p>
        <FeatureList items={features} />
      </div>
      <InfoBanner tone="accent">{t.onboarding.completePrompt}</InfoBanner>
    </div>
  );
}
