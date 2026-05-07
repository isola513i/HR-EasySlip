import type { Metadata } from "next";
import { OffboardingDashboard } from "@/components/hr/offboarding/offboarding-dashboard";

export const metadata: Metadata = { title: "Offboarding — EasySlip HR" };

export default function OffboardingPage() {
  return <OffboardingDashboard />;
}
