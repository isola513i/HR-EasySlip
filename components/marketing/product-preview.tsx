import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"
import { ProductPreviewTabs, type PreviewTab } from "./product-preview-tabs"

export default async function ProductPreview() {
  const locale = await getLocale()
  const t = getDictionary(locale).marketing.preview

  const tabs: PreviewTab[] = [
    {
      value: "dashboard",
      label: t.tabs.dashboard.label,
      alt: t.tabs.dashboard.alt,
      src: "/mock/screenshot_1.5x_postspark_2026-05-14_17-21-28.png",
      width: 1264,
      height: 846,
      bullets: [t.tabs.dashboard.b1, t.tabs.dashboard.b2, t.tabs.dashboard.b3],
    },
    {
      value: "attendance",
      label: t.tabs.attendance.label,
      alt: t.tabs.attendance.alt,
      src: "/mock/screenshot_1.5x_postspark_2026-05-14_17-22-02.png",
      width: 1264,
      height: 846,
      bullets: [t.tabs.attendance.b1, t.tabs.attendance.b2, t.tabs.attendance.b3],
    },
    {
      value: "signin",
      label: t.tabs.signin.label,
      alt: t.tabs.signin.alt,
      src: "/mock/device-mockup_1.5x_postspark_2026-05-14_17-19-29.png",
      width: 1440,
      height: 1080,
      bullets: [t.tabs.signin.b1, t.tabs.signin.b2, t.tabs.signin.b3],
    },
  ]

  return (
    <section aria-labelledby="preview-heading" className="relative overflow-hidden bg-gradient-to-b from-[#eef4ff] via-[#f4f7ff] to-white py-14 sm:py-24">
      {/* Soft top-left glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, oklch(72% 0.14 240 / 0.4), transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 id="preview-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-7 sm:mt-10">
          <ProductPreviewTabs tabs={tabs} />
        </div>
      </div>
    </section>
  )
}
