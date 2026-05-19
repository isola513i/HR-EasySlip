import Link from "next/link"
import Image from "next/image"
import { Sparkles, ShieldCheck } from "lucide-react"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export async function HeroSection() {
  const locale = await getLocale()
  const t = getDictionary(locale).marketing.hero

  const headline = t.headline.replace("\n", " ")

  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden bg-linear-to-b from-[#eef4ff] via-white to-[#f6f8fa] py-14 sm:py-24 lg:py-32">
      {/* Layered glow accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-12%] -top-32 h-[640px] w-[640px] rounded-full opacity-90"
        style={{
          background:
            "radial-gradient(closest-side, oklch(72% 0.14 240 / 0.55), oklch(72% 0.14 240 / 0.12) 55%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-40 h-[420px] w-[420px] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(closest-side, oklch(64% 0.18 268 / 0.32), transparent 70%)",
        }}
      />
      {/* Dot pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(oklch(60% 0.14 265 / 0.35) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 25%, black 70%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 25%, black 70%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">

          {/* Left: text */}
          <div className="space-y-5 sm:space-y-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-primary shadow-sm ring-1 ring-primary/15 backdrop-blur">
              <Sparkles className="size-3.5" aria-hidden />
              {t.badge}
            </span>

            <h1 id="hero-heading" className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {headline}
            </h1>

            <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-lg">
              {t.subheadline}
            </p>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <Link
                href="/signup"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group/heroCta relative w-full overflow-hidden font-semibold shadow-lg shadow-primary/25 sm:w-auto",
                  "h-12 text-base lg:h-14 lg:px-10",
                  "bg-linear-to-r from-[#3d46cc] via-[#2f50e6] to-[#3b82f6] bg-clip-border border-[#3d46cc]",
                  "[a]:hover:from-[#2a36d4] [a]:hover:via-[#2745d9] [a]:hover:to-[#2563eb]",
                  "motion-safe:[a]:hover:-translate-y-0.5 [a]:hover:shadow-xl [a]:hover:shadow-primary/35 transition-[transform,box-shadow,background-color] duration-200 ease-out"
                )}
              >
                {t.ctaPrimary}
              </Link>
              <Link
                href="#features"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "w-full h-11 text-sm font-medium bg-transparent text-muted-foreground border-border/60 transition-[background-color,border-color,color,box-shadow] duration-200 ease-out sm:h-11 sm:bg-white/80 sm:backdrop-blur sm:text-foreground sm:border-input sm:w-auto lg:h-14 lg:px-10 lg:text-base",
                  "[a]:hover:bg-white [a]:hover:border-primary/40 [a]:hover:text-primary [a]:hover:shadow-md [a]:hover:shadow-primary/10"
                )}
              >
                {t.ctaSecondary}
              </Link>
            </div>

            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
              {t.noCreditCard}
            </p>
          </div>

          {/* Right: framed screenshot with hover interaction */}
          <div className="group relative -mx-2 sm:mx-0">
            {/* Soft glow behind the laptop */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-6 -bottom-2 rounded-[3rem] opacity-70 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(55% 50% at 50% 50%, oklch(72% 0.16 240 / 0.45), transparent 75%)",
                filter: "blur(32px)",
              }}
            />
            <Image
              src="/mock/device-mockup-transparent.png"
              alt="EasySlip HR shown on a laptop"
              width={1183}
              height={727}
              sizes="(max-width: 1024px) 100vw, 720px"
              priority
              className="relative h-auto w-full drop-shadow-[0_30px_40px_oklch(45%_0.20_268/0.18)] transition-transform duration-900 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:scale-[1.03]"
            />
          </div>

        </div>
      </div>
    </section>
  )
}
