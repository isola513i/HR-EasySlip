import type { Metadata } from "next";
import { getDict } from "@/lib/i18n/get-dict";
import { AuthLayout } from "@/components/shared/auth-layout";
import { ForgotPasswordForm } from "@/app/[slug]/signin/forgot-password/forgot-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.password.forgotTitle };
}

export default async function GlobalForgotPasswordPage() {
  const { t } = await getDict();

  return (
    <AuthLayout
      heading={t.password.forgotTitle}
      subtitle={t.password.forgotSubtitle}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
    >
      {/* slug omitted → back link goes to /signin */}
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
