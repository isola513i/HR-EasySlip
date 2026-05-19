"use client"

import Image from "next/image"
import { Check } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export interface PreviewTab {
  value: string
  label: string
  alt: string
  src: string
  width: number
  height: number
  bullets: [string, string, string]
}

export function ProductPreviewTabs({ tabs }: { tabs: PreviewTab[] }) {
  const defaultValue = tabs[0]?.value

  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      {/* Branded segmented control — scrollable on mobile if needed */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0">
        <TabsList
          className="mx-auto flex h-auto w-fit gap-1 rounded-full border border-primary/15 bg-white p-1 shadow-sm shadow-primary/5"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="min-h-[2.5rem] whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-active:bg-gradient-to-r data-active:from-[#3d46cc] data-active:to-[#3b82f6] data-active:text-white data-active:shadow-sm sm:min-h-[2.75rem] sm:px-4 sm:text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-7 sm:mt-12">
          <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
            {/* Framed screenshot — breathes to viewport edges on mobile for better legibility */}
            <div className="group relative -mx-4 sm:mx-0">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 rounded-[2rem] opacity-60 transition-[opacity,inset] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:-inset-10 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(50% 50% at 50% 50%, oklch(70% 0.16 240 / 0.45), transparent 75%)",
                  filter: "blur(28px)",
                }}
              />
              <div className="relative overflow-hidden rounded-none shadow-xl ring-1 ring-primary/15 transition-[transform,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-safe:group-hover:-translate-y-1.5 group-hover:shadow-[0_40px_80px_-20px_oklch(45%_0.20_268_/_0.32)] group-hover:ring-primary/25 sm:rounded-2xl">
                <Image
                  src={tab.src}
                  alt={tab.alt}
                  width={tab.width}
                  height={tab.height}
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="block h-auto w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-safe:group-hover:scale-[1.06]"
                />
              </div>
            </div>

            <ul className="space-y-3 sm:space-y-3.5">
              {tab.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2.5 text-sm text-foreground sm:text-base ${
                    i === 2 ? "hidden sm:flex" : ""
                  }`}
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#3b82f6] text-white shadow-sm shadow-primary/30">
                    <Check className="size-3" aria-hidden />
                  </span>
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
