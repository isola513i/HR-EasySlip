import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getDict } from "@/lib/i18n/get-dict";
import { AuthLayout } from "@/components/shared/auth-layout";
import { getInboxProvider } from "@/lib/email/inbox-providers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.checkEmail.pageTitle };
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function CheckEmailPage({ params, searchParams }: Props) {
  const [{ slug }, { email }, { t }] = await Promise.all([params, searchParams, getDict()]);
  const provider = email ? getInboxProvider(email) : null;

  return (
    <AuthLayout
      heading={t.checkEmail.heading}
      subtitle={t.checkEmail.instruction}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
    >
      <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
        <p className="font-medium">{t.checkEmail.notFound}</p>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li>{t.checkEmail.checkSpam}</li>
          <li>{t.checkEmail.waitMoment}</li>
          <li>{t.checkEmail.tryAgain}</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/${slug}/signin`}
          className={buttonVariants({
            variant: "outline",
            className: "h-12 flex-1 cursor-pointer text-base md:h-12",
          })}
        >
          {t.checkEmail.backToSignIn}
        </Link>
        {provider ? (
          <a
            href={provider.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              className: "h-12 flex-1 cursor-pointer text-base md:h-12",
            })}
          >
            {t.checkEmail.openInbox.replace("{provider}", provider.name)}
          </a>
        ) : null}
      </div>
    </AuthLayout>
  );
}
