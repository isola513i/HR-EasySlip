import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"

export const metadata: Metadata = {
  title: "Request Received — EasySlip HR",
}

export default async function SignupThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams
  const locale = await getLocale()
  const t = getDictionary(locale).marketing.signup.thanks

  return (
    <section className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle2 className="size-10 text-green-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="mt-2 text-muted-foreground">{t.message}</p>
          {email && (
            <p className="mt-3 text-sm">
              <span className="text-muted-foreground">{t.checkEmail} </span>
              <strong>{email}</strong>
            </p>
          )}
        </div>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t.backHome}
        </Link>
      </div>
    </section>
  )
}
