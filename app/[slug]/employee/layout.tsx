import type { Viewport } from "next";
import { requireRoles, EMPLOYEE_ROLES, MANAGER_ROLES } from "@/lib/security/rbac";
import { requireConsent } from "@/lib/consent/require-consent";
import { getOnboardingRemainingCount } from "@/lib/onboarding/checklist-service";
import { BottomNav } from "@/components/employee/bottom-nav";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { OnboardingBanner } from "@/components/shared/onboarding-banner";
import { PendingCountsProvider } from "@/contexts/pending-counts-provider";
import { ApprovalCountsProvider } from "@/contexts/approval-counts-provider";
import type { Role } from "@prisma/client";

export const viewport: Viewport = {
  themeColor: "#10151e",
};

export default async function EmployeeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireRoles(EMPLOYEE_ROLES, slug);
  await requireConsent("/employee/today");

  const isManager = user.roles.some((r) => (MANAGER_ROLES as readonly Role[]).includes(r));

  const onboardingRemaining = user.employeeId
    ? await getOnboardingRemainingCount(user.employeeId)
    : 0;

  return (
    <div className="mx-auto min-h-dvh max-w-md overscroll-contain bg-background">
      <OfflineBanner />
      {onboardingRemaining > 0 && <OnboardingBanner remaining={onboardingRemaining} />}
      <PendingCountsProvider>
        {isManager ? (
          <ApprovalCountsProvider>
            <div className="pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]">{children}</div>
            <BottomNav isManager />
          </ApprovalCountsProvider>
        ) : (
          <>
            <div className="pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]">{children}</div>
            <BottomNav />
          </>
        )}
      </PendingCountsProvider>
    </div>
  );
}
