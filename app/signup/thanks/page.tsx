import type { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import { AuthLayout } from "@/components/shared/auth-layout"
import { getInboxProvider } from "@/lib/email/inbox-providers"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "ตรวจสอบอีเมลของคุณ — EasySlip HR",
}

interface Props {
  searchParams: Promise<{ email?: string }>
}

export default async function SignupThanksPage({ searchParams }: Props) {
  const { email } = await searchParams
  const locale = await getLocale()
  const t = getDictionary(locale)
  const s = t.marketing.signup.thanks

  const provider = email ? getInboxProvider(email) : null
  const subtitle = s.instruction.replace("{email}", email ?? "")

  return (
    <AuthLayout
      heading={s.heading}
      subtitle={subtitle}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
    >
      <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
        <p className="font-medium">{s.notFound}</p>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li>{s.checkSpam}</li>
          <li>{s.waitMoment}</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className={buttonVariants({
            variant: "outline",
            className: "h-12 flex-1 text-base",
          })}
        >
          {s.backHome}
        </Link>
        {provider && (
          <a
            href={provider.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              className: "h-12 flex-1 text-base",
            })}
          >
            {s.openInbox.replace("{provider}", provider.name)}
          </a>
        )}
      </div>
    </AuthLayout>
  )
}
