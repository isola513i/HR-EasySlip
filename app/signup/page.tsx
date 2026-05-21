import type { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import { AuthLayout } from "@/components/shared/auth-layout"
import { SignupForm } from "@/components/marketing/signup-form"

export const metadata: Metadata = {
  title: "Start Free Trial — EasySlip HR",
}

export default async function SignupPage() {
  const locale = await getLocale()
  const t = getDictionary(locale)
  const s = t.marketing.signup

  return (
    <AuthLayout
      heading={s.pageTitle}
      subtitle={s.pageSubtitle}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
      wide
    >
      <SignupForm dict={s} rootDomain={process.env.NEXT_PUBLIC_APP_URL ?? ""} />
    </AuthLayout>
  )
}
