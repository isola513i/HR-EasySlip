import { Zap, Shield, Globe2, Building2 } from "lucide-react"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"

const VALUE_ICONS = [Zap, Shield, Globe2] as const

export default async function AboutSection() {
  const locale = await getLocale()
  const t = getDictionary(locale).marketing.about

  const values = [t.values.v1, t.values.v2, t.values.v3]

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-24 py-14 sm:py-24"
      style={{ background: "linear-gradient(160deg, #f5f8ff 0%, #ffffff 50%, #f8faff 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-start">

          {/* Left: brand story */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary mb-4 sm:mb-6">
              <Building2 className="size-4" aria-hidden />
              {t.badge}
            </div>
            <h2 id="about-heading" className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {t.title}
            </h2>
            <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground">{t.story1}</p>
              <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground">{t.story2}</p>
            </div>

            {/* Brand logo strip */}
            <div className="mt-10 hidden sm:inline-flex items-center gap-3 rounded-2xl border border-primary/10 bg-white px-5 py-3 shadow-sm">
              <div
                className="size-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3d46cc, #06b6d4)" }}
                aria-hidden
              >
                <span className="text-white text-xs font-bold">ES</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-none">EasySlip</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.brandTagline}</p>
              </div>
            </div>
          </div>

          {/* Right: values */}
          <div className="space-y-4 sm:space-y-6 lg:pt-2">
            {values.map(({ label, desc }, i) => {
              const Icon = VALUE_ICONS[i]
              return (
                <div
                  key={label}
                  className="flex gap-4 rounded-2xl border border-primary/8 bg-white p-5 shadow-sm"
                >
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="size-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </section>
  )
}
