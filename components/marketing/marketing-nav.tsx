import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NavLinks } from "./nav-links"
import { MobileMenuLazy } from "./mobile-menu-lazy"

export async function MarketingNav() {
  const [session, locale] = await Promise.all([auth(), getLocale()])
  const t = getDictionary(locale).marketing.nav
  const isAuthed = !!session?.user

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Image
            src="/favicons/android-chrome-192x192.png"
            alt=""
            width={40}
            height={40}
            className="rounded-xl"
          />
          <span className="text-lg font-semibold text-foreground" translate="no">EasySlip HR</span>
        </Link>

        {/* Desktop center nav links */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          <NavLinks
            links={[
              { href: "#features", label: t.features },
              { href: "#use-cases", label: t.useCases },
              { href: "#pricing", label: t.pricing },
              { href: "#faq", label: t.faq },
              { href: "#about", label: t.about },
            ]}
            linkClassName="rounded-sm text-base font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            activeLinkClassName="text-foreground"
          />
        </nav>

        {/* Desktop right actions */}
        <div className="hidden items-center gap-2 lg:flex">
          {isAuthed ? (
            <Link href="/dashboard" className={cn(buttonVariants(), "bg-clip-border border-primary")}>
              {t.goToDashboard}
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                {t.signIn}
              </Link>
              <Link href="/signup" target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), "bg-clip-border border-primary")}>
                {t.startTrial}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger — client component */}
        <MobileMenuLazy
          isAuthed={isAuthed}
          labels={{
            menuTitle: t.menuTitle,
            features: t.features,
            useCases: t.useCases,
            pricing: t.pricing,
            faq: t.faq,
            about: t.about,
            signIn: t.signIn,
            startTrial: t.startTrial,
            goToDashboard: t.goToDashboard,
          }}
        />
      </div>
    </header>
  )
}
