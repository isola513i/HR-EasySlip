import { OnboardingWelcome } from "@/components/employee/onboarding-welcome";
import { OnboardingChecklist } from "@/components/employee/onboarding-checklist";
import { pageMetadata } from "@/lib/i18n/page-metadata";

export const generateMetadata = () => pageMetadata("onboarding");

export default function EmployeeOnboardingPage() {
  return (
    <div className="px-4 py-6">
      <div className="rounded-2xl border bg-card p-6 shadow-[var(--es-shadow-sm)]">
        <div className="flex flex-col gap-6">
          <OnboardingWelcome />
          <OnboardingChecklist />
        </div>
      </div>
    </div>
  );
}
