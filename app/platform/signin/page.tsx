import { getPlatformSession } from "@/lib/auth/platform";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/shared/auth-layout";
import { PlatformSignInForm } from "./sign-in-form";
import { PlatformMarketing } from "./platform-marketing";

export const metadata = { title: "Platform Admin — EasySlip" };

export default async function PlatformSignInPage() {
  const session = await getPlatformSession();
  if (session) redirect("/platform/overview");

  const isDev = process.env.NODE_ENV === "development";

  return (
    <AuthLayout
      heading="Platform Admin"
      subtitle="Staff access only"
      marketingSlot={<PlatformMarketing />}
      copyright={`© ${new Date().getFullYear()} EasySlip`}
      privacyPolicy="Privacy Policy"
      hidePlatformLink
    >
      <PlatformSignInForm
        devEmail={isDev ? (process.env.PLATFORM_ADMIN_EMAIL ?? "admin@easyslip.app") : undefined}
        devPassword={isDev ? (process.env.PLATFORM_ADMIN_PASSWORD ?? undefined) : undefined}
      />
    </AuthLayout>
  );
}
