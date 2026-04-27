import { OnboardingWelcome } from "@/components/employee/onboarding-welcome";
import { OnboardingChecklist } from "@/components/employee/onboarding-checklist";

export default function EmployeeOnboardingPage() {
  return (
    <>
      <header className="flex h-14 items-center border-b border-[var(--es-neutral-100)] px-4">
        <span className="text-base font-semibold">Onboarding</span>
      </header>
      <div className="flex flex-col gap-4 p-4">
        <OnboardingWelcome />
        <OnboardingChecklist />
      </div>
    </>
  );
}
