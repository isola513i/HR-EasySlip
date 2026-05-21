import type { Metadata } from "next"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"

export async function generateMetadata(): Promise<Metadata> {
  return { title: "403 Forbidden" }
}

export default async function ForbiddenPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ reason?: string }>
}) {
  const [{ slug }, { reason }] = await Promise.all([params, searchParams])
  const locale = await getLocale()
  const t = getDictionary(locale)
  const isSuspended = reason === "suspended"

  return (
    <main
      id="main-content"
      className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-16"
    >
      <div className="flex flex-col items-center text-center max-w-xs w-full">
        <div
          className="size-14 rounded-2xl flex items-center justify-center shadow-sm mb-8"
          style={{ background: "linear-gradient(135deg, #3d46cc, #06b6d4)" }}
          aria-hidden
        >
          <span className="text-white text-xl font-bold tracking-tight">ES</span>
        </div>

        <p className="font-mono text-4xl font-bold text-muted-foreground/40 mb-4">403</p>

        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {isSuspended ? t.errors.suspendedTitle : t.errors.forbidden}
        </h1>

        {isSuspended && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t.errors.suspendedMessage}
          </p>
        )}

        <Link
          href={`/${slug}/signin`}
          className={buttonVariants({ variant: "outline", className: "mt-8 w-full" })}
        >
          {t.common.back}
        </Link>
      </div>

      <p className="absolute bottom-8 text-xs text-muted-foreground/50">
        EasySlip HR · Powered by EasySlip
      </p>
    </main>
  )
}
