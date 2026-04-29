import type { Metadata } from "next";
import { getDict } from "@/lib/i18n/get-dict";
import { AuthLayout } from "@/components/shared/auth-layout";
import { ResetPasswordForm } from "./reset-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.password.resetTitle };
}

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const [{ token, email }, { t }] = await Promise.all([
    searchParams,
    getDict(),
  ]);

  return (
    <AuthLayout
      heading={t.password.resetTitle}
      subtitle={t.password.resetSubtitle}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
    >
      <ResetPasswordForm token={token ?? ""} email={email ?? ""} />
    </AuthLayout>
  );
}
