import type { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import { AuthLayout } from "@/components/shared/auth-layout"
import { buttonVariants } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Workspace พร้อมแล้ว — EasySlip HR",
}

interface Props {
  searchParams: Promise<{ slug?: string }>
}

export default async function SignupSuccessPage({ searchParams }: Props) {
  const { slug } = await searchParams
  if (!slug) notFound()

  const locale = await getLocale()
  const t = getDictionary(locale)
  const s = t.marketing.signup.success
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  return (
    <AuthLayout
      heading={s.heading}
      subtitle={s.subtitle}
      marketingHeading={t.signin.marketingHeading}
      marketingTagline={t.signin.marketingTagline}
      copyright={t.signin.copyright}
      privacyPolicy={t.signin.privacyPolicy}
    >
      <div className="flex flex-col items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
        <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-0.5">{s.workspaceLabel}</p>
          <p className="font-mono text-sm font-semibold text-foreground break-all">{appUrl}/{slug}</p>
        </div>
      </div>

      <Link
        href={`/${slug}/signin`}
        className={buttonVariants({ className: "w-full h-12 text-base font-semibold" })}
      >
        {s.signIn}
      </Link>
    </AuthLayout>
  )
}
