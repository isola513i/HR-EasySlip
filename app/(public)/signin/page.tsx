import type { Metadata } from "next";
import { getDict } from "@/lib/i18n/get-dict";
import { AuthLayout } from "@/components/shared/auth-layout";
import { SignInForm } from "@/app/[slug]/signin/signin-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.signin.pageTitle };
}

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function GlobalSignInPage({ searchParams }: Props) {
  const [{ error }, { t }] = await Promise.all([searchParams, getDict()]);

  const errorMessage = error
    ? (t.signin.errors[error as keyof typeof t.signin.errors] ?? t.signin.errors.Default)
    : null;

  return (
    <AuthLayout
      heading={t.signin.heading}
      subtitle={t.signin.subtitle}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
    >
      {errorMessage && (
        <div
          role="alert"
          className="space-y-1 rounded-lg border border-destructive/40 bg-(--es-error-50) p-4 text-sm text-destructive"
        >
          <p className="font-medium">{t.signin.errorTitle}</p>
          <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
        </div>
      )}
      {/* slug omitted → global mode: redirects to /workspaces after login */}
      <SignInForm dict={t.signin} />
    </AuthLayout>
  );
}
