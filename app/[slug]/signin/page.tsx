import type { Metadata } from "next";
import { getDict } from "@/lib/i18n/get-dict";
import { AuthLayout } from "@/components/shared/auth-layout";
import { SignInForm } from "./signin-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.signin.pageTitle };
}

interface SignInPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [{ error }, { t }] = await Promise.all([searchParams, getDict()]);

  const errorMessage = error
    ? (t.signin.errors[error as keyof typeof t.signin.errors] ??
      t.signin.errors.Default)
    : null;

  return (
    <AuthLayout
      heading={t.signin.heading}
      subtitle={t.signin.subtitle}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
      platformAdminLink={t.signin.platformAdminLink}
    >
      {errorMessage ? (
        <div
          role="alert"
          className="space-y-1 rounded-lg border border-destructive/40 bg-(--es-error-50) p-4 text-sm text-destructive"
        >
          <p className="font-medium">{t.signin.errorTitle}</p>
          <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
          {error ? (
            <p className="pt-1 font-mono text-[10px] opacity-60">
              code: {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <SignInForm dict={t.signin} />
    </AuthLayout>
  );
}
