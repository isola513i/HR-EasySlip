import { Shield, Database, RefreshCw, Building2 } from "lucide-react"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import type { Dictionary } from "@/lib/i18n/dictionaries"

type PillarKey = keyof Dictionary["marketing"]["trust"]["pillars"]

const PILLAR_ICONS: Record<PillarKey, React.ComponentType<{ className?: string }>> = {
  pdpa: Shield,
  isolation: Database,
  payroll: RefreshCw,
  thaiWorkflow: Building2,
}

const ORDER: PillarKey[] = ["pdpa", "isolation", "payroll", "thaiWorkflow"]

export default async function TrustPillars() {
  const locale = await getLocale()
  const trust = getDictionary(locale).marketing.trust
  const t = trust.pillars

  return (
    <section aria-label={trust.sectionLabel} className="relative border-y border-primary/10 bg-gradient-to-b from-white via-[#f4f7ff] to-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4">
          {ORDER.map((key) => {
            const Icon = PILLAR_ICONS[key]
            const pillar = t[key]
            return (
              <li key={key} className="flex items-start gap-2.5 sm:gap-3">
                <span
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-primary/15 ring-1 ring-white/40 sm:size-10"
                  style={{ background: "linear-gradient(135deg, #3d46cc 0%, #3b82f6 60%, #06b6d4 100%)" }}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground leading-snug sm:text-sm">
                    {pillar.label}
                  </p>
                  <p className="mt-0.5 hidden text-xs text-muted-foreground leading-relaxed sm:block">
                    {pillar.sublabel}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
