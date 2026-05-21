import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getControlPlane } from "@/lib/db/control-plane";
import { getDict } from "@/lib/i18n/get-dict";
import { AuthLayout } from "@/components/shared/auth-layout";
import { ChangePasswordForm } from "./change-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.password.changeTitle };
}

export default async function ChangePasswordPage() {
  const [{ t }, session] = await Promise.all([getDict(), auth()]);

  let skipCurrent = false;
  if (session?.user?.id) {
    const u = await getControlPlane().user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true, mustChangePassword: true },
    });
    skipCurrent = !u?.passwordHash || Boolean(u?.mustChangePassword);
  }

  const email = session?.user?.email ?? "";
  const heading = skipCurrent ? t.password.setupTitle : t.password.changeTitle;
  const subtitleBase = skipCurrent ? t.password.setupSubtitle : t.password.mustChange;
  const subtitle = email ? `${subtitleBase} ${email}` : subtitleBase;

  return (
    <AuthLayout
      heading={heading}
      subtitle={subtitle}
      marketingHeading={t.password.marketingHeading}
      marketingTagline={t.password.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
      hidePlatformLink
    >
      <ChangePasswordForm firstTimeSetup={skipCurrent} />
    </AuthLayout>
  );
}
