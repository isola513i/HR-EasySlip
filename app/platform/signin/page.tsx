import { getPlatformSession } from "@/lib/auth/platform";
import { redirect } from "next/navigation";
import { getDict } from "@/lib/i18n/get-dict";
import { AuthLayout } from "@/components/shared/auth-layout";
import { PlatformSignInForm } from "./sign-in-form";
import { PlatformMarketing } from "./platform-marketing";

export const metadata = { title: "Platform Admin — EasySlip" };

export default async function PlatformSignInPage() {
  const session = await getPlatformSession();
  if (session) redirect("/platform/overview");

  const { t } = await getDict();
  const isDev = process.env.NODE_ENV === "development";

  return (
    <AuthLayout
      heading={t.platform.signin.heading}
      subtitle={t.platform.signin.subtitle}
      marketingSlot={<PlatformMarketing t={t.platform.signin} />}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
      hidePlatformLink
    >
      <PlatformSignInForm
        t={t.platform.signin}
        devEmail={isDev ? (process.env.PLATFORM_ADMIN_EMAIL ?? "admin@easyslip.app") : undefined}
        devPassword={isDev ? (process.env.PLATFORM_ADMIN_PASSWORD ?? undefined) : undefined}
      />
    </AuthLayout>
  );
}
