import type { Viewport } from "next";
import { requireRoles, EMPLOYEE_ROLES } from "@/lib/security/rbac";
import { requireConsent } from "@/lib/consent/require-consent";
import { getOnboardingRemainingCount } from "@/lib/onboarding/checklist-service";
import { BottomNav } from "@/components/employee/bottom-nav";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { OnboardingBanner } from "@/components/shared/onboarding-banner";

export const viewport: Viewport = {
  themeColor: "#10151e",
};

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRoles(EMPLOYEE_ROLES);
  await requireConsent("/employee/today");

  const onboardingRemaining = user.employeeId
    ? await getOnboardingRemainingCount(user.employeeId)
    : 0;

  return (
    <div className="mx-auto min-h-dvh max-w-md overscroll-contain bg-background">
      <OfflineBanner />
      {onboardingRemaining > 0 && <OnboardingBanner remaining={onboardingRemaining} />}
      <div className="pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]">{children}</div>
      <BottomNav />
    </div>
  );
}
