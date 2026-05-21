import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/get-dict";
import { AuthLayout } from "@/components/shared/auth-layout";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.signin.errorTitle };
}

export default async function GlobalSignInErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, { t }] = await Promise.all([searchParams, getDict()]);

  type ErrorKey = keyof typeof t.signin.errorTitles;
  const key: ErrorKey =
    error && error in t.signin.errorTitles ? (error as ErrorKey) : "Default";

  return (
    <AuthLayout
      heading={t.signin.errorTitles[key]}
      subtitle={t.signin.errors[key]}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
    >
      {error ? (
        <p className="text-center font-mono text-xs text-muted-foreground/80">
          code: {error}
        </p>
      ) : null}
      <Link
        href="/signin"
        className={buttonVariants({
          variant: "outline",
          className: "h-12 w-full cursor-pointer text-base md:h-12",
        })}
      >
        {t.checkEmail.backToSignIn}
      </Link>
    </AuthLayout>
  );
}
