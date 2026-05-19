import { ArrowDown, Sparkles } from "lucide-react"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import type { Dictionary } from "@/lib/i18n/dictionaries"

type ItemKey = keyof Dictionary["marketing"]["problem"]["items"]
const ORDER: ItemKey[] = ["p1", "p2", "p3"]

export default async function ProblemSolution() {
  const locale = await getLocale()
  const t = getDictionary(locale).marketing.problem

  return (
    <section aria-labelledby="problem-heading" className="bg-background py-14 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 id="problem-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-14 sm:gap-10 md:grid-cols-3 md:gap-8">
          {ORDER.map((key) => {
            const item = t.items[key]
            return (
              <article
                key={key}
                className="relative flex flex-col rounded-2xl border border-primary/10 bg-white p-5 shadow-sm sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
              >
                {/* Problem block */}
                <span className="inline-flex w-fit items-center rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/60">
                  {item.tag}
                </span>
                <h3 className="mt-2.5 text-[15px] font-semibold text-foreground leading-snug sm:mt-3 sm:text-lg">
                  {item.problem}
                </h3>
                <p className="mt-1.5 hidden text-sm leading-relaxed text-muted-foreground sm:mt-2 sm:block">
                  {item.impact}
                </p>

                {/* Connector */}
                <div className="my-4 flex items-center gap-2 sm:my-6 sm:gap-3">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-primary/10" />
                  <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#3b82f6] text-white shadow-sm shadow-primary/30 sm:size-6">
                    <ArrowDown className="size-3" aria-hidden />
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-primary/10 via-primary/30 to-transparent" />
                </div>

                {/* Solution block */}
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:size-6">
                    <Sparkles className="size-3" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-primary sm:text-sm">
                      {item.solution}
                    </p>
                    <p className="mt-1 hidden text-sm leading-relaxed text-foreground/80 sm:block">
                      {item.solutionDesc}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
