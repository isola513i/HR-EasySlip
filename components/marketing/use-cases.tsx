import { Users, Building, Briefcase, Lock } from "lucide-react"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import type { Dictionary } from "@/lib/i18n/dictionaries"

type PersonaKey = keyof Dictionary["marketing"]["useCases"]["personas"]

const PERSONA_ICONS: Record<PersonaKey, React.ComponentType<{ className?: string }>> = {
  p1: Users,
  p2: Building,
  p3: Briefcase,
  p4: Lock,
}

const ORDER: PersonaKey[] = ["p1", "p2", "p3", "p4"]

export default async function UseCases() {
  const locale = await getLocale()
  const t = getDictionary(locale).marketing.useCases

  return (
    <section id="use-cases" aria-labelledby="use-cases-heading" className="scroll-mt-24 bg-background py-14 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 id="use-cases-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
            {t.subtitle}
          </p>
        </div>

        {/* Mobile: horizontal scroll snap; Desktop: 4-col grid */}
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {ORDER.map((key) => {
            const persona = t.personas[key]
            const Icon = PERSONA_ICONS[key]
            return (
              <article
                key={key}
                className="group relative flex w-[78vw] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-b from-white via-white to-[#f4f7ff] p-5 shadow-sm shadow-primary/5 transition-[transform,box-shadow] motion-safe:hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 hover:ring-1 hover:ring-primary/20 sm:w-auto sm:shrink sm:snap-none sm:p-6"
              >
                <span
                  className="flex size-10 items-center justify-center rounded-xl text-white shadow-md shadow-primary/20"
                  style={{ background: "linear-gradient(135deg, #3d46cc 0%, #3b82f6 65%, #06b6d4 130%)" }}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-primary/80 sm:mt-4">
                  {persona.label}
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-foreground sm:mt-3">
                  {persona.outcome}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-4 sm:pt-5">
                  {[persona.c1, persona.c2, persona.c3].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary/85"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
