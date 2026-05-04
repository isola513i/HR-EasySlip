import type { Metadata } from "next";
import { OnboardingWelcome } from "@/components/employee/onboarding-welcome";
import { OnboardingChecklist } from "@/components/employee/onboarding-checklist";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.pageTitles.onboarding };
}

export default async function EmployeeOnboardingPage() {
  const t = getDictionary(await getLocale());
  return (
    <>
      <header className="flex h-14 items-center border-b border-[var(--es-neutral-100)] px-4">
        <span className="text-base font-semibold">{t.metadata.pageTitles.onboarding}</span>
      </header>
      <div className="flex flex-col gap-4 p-4">
        <OnboardingWelcome />
        <OnboardingChecklist />
      </div>
    </>
  );
}
