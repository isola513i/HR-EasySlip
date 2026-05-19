import type { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import { AuthLayout } from "@/components/shared/auth-layout"
import { WorkspaceForm } from "./workspace-form"

export const metadata: Metadata = {
  title: "Sign In — EasySlip HR",
}

export default async function LoginPage() {
  const locale = await getLocale()
  const t = getDictionary(locale)
  const d = t.marketing.login

  return (
    <AuthLayout
      heading={d.title}
      subtitle={d.subtitle}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
    >
      <WorkspaceForm
        dict={d}
        rootDomain={process.env.ROOT_DOMAIN ?? "localhost:3000"}
      />
    </AuthLayout>
  )
}
