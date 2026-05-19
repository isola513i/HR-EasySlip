import { MapPin, CalendarDays, Clock, RefreshCw, Smartphone, Shield } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type FeatureKey = "clock" | "leave" | "ot" | "empeo" | "pwa" | "pdpa";

const FEATURE_ICONS: Record<FeatureKey, React.ComponentType<{ className?: string }>> = {
  clock: MapPin,
  leave: CalendarDays,
  ot: Clock,
  empeo: RefreshCw,
  pwa: Smartphone,
  pdpa: Shield,
};

const DOMINANT: FeatureKey = "clock";
const SUPPORTING: FeatureKey[] = ["leave", "ot", "empeo", "pwa", "pdpa"];

function getFeature(t: Dictionary, key: FeatureKey) {
  const map = {
    clock: t.marketing.features.clock,
    leave: t.marketing.features.leave,
    ot: t.marketing.features.ot,
    empeo: t.marketing.features.empeo,
    pwa: t.marketing.features.pwa,
    pdpa: t.marketing.features.pdpa,
  };
  return map[key];
}

export default async function FeatureGrid() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const f = t.marketing.features;
  const dominant = getFeature(t, DOMINANT);

  return (
    <section id="features" aria-labelledby="features-heading" className="scroll-mt-24 overflow-hidden">
      {/* Section intro — left-aligned, no pill */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-24 pb-7 sm:pb-14">
        <h2 id="features-heading" className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground max-w-2xl leading-tight">
          {f.title}
        </h2>
        <p className="mt-3 sm:mt-4 text-muted-foreground text-[15px] sm:text-lg max-w-lg leading-relaxed">
          {f.subtitle}
        </p>
      </div>

      {/* Dominant feature — brand-primary full-width panel */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl overflow-hidden shadow-xl shadow-primary/20"
          style={{
            background:
              "linear-gradient(135deg, #1d2bca 0%, #3d46cc 35%, #2f50e6 70%, #06b6d4 130%)",
          }}
        >
          {/* Subtle dot pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative flex flex-col lg:flex-row">
            {/* Text side */}
            <div className="flex-1 px-6 py-8 sm:px-12 sm:py-12 lg:px-16 lg:py-16 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50 mb-4 sm:mb-6 select-none">
                01 · {f.sectionLabel}
              </p>
              <h3 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-white leading-[1.08] sm:leading-[1.06] tracking-tight">
                {dominant.title}
              </h3>
              <p className="mt-3 sm:mt-5 text-white/75 text-sm sm:text-lg leading-relaxed max-w-sm">
                {dominant.description}
              </p>
            </div>

            {/* Illustration side */}
            <div className="flex-1 relative min-h-[200px] sm:min-h-[260px] lg:min-h-0" aria-hidden>
              {/* Decorative depth circles */}
              <div
                className="absolute -right-20 -top-20 size-[420px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(closest-side, oklch(78% 0.16 215 / 0.42), transparent 70%)" }}
              />
              <div
                className="absolute -bottom-28 left-4 size-[320px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(closest-side, oklch(55% 0.22 268 / 0.45), transparent 70%)" }}
              />

              {/* Clock-in card */}
              <div className="absolute inset-0 flex items-center justify-center p-8 lg:justify-start lg:pl-10">
                <div className="w-[200px] rounded-2xl bg-white/10 ring-1 ring-white/20 p-5 shadow-2xl">
                  {/* GPS coords */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin className="size-3 text-white/40 shrink-0" />
                    <span className="text-[10px] text-white/40 font-mono truncate">13.756° N · 100.501° E</span>
                  </div>

                  {/* Time */}
                  <p className="text-[2.6rem] font-black text-white tracking-tighter leading-none">09:03</p>
                  <p className="text-[10px] text-white/35 mt-1">พ. 14 พ.ค. 2568</p>

                  {/* Status */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-300 tracking-wider">CHECKED IN</span>
                  </div>

                  {/* Employee */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                    <span className="size-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      สช
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate">สมชาย ใจดี</p>
                      <p className="text-[9px] text-white/40">Engineering · PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 supporting features — numbered strip with dividers, no shadow cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-3 pb-14 sm:pb-28">
        <div className="rounded-2xl border border-primary/10 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {SUPPORTING.map((key, i) => {
              const feature = getFeature(t, key);
              const Icon = FEATURE_ICONS[key];
              return (
                <SupportingItem
                  key={key}
                  number={i + 2}
                  Icon={Icon}
                  title={feature.title}
                  description={feature.description}
                  isLast={i === SUPPORTING.length - 1}
                  isSmLeftCol={i % 2 === 0}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SupportingItem({
  number,
  Icon,
  title,
  description,
  isLast,
  isSmLeftCol,
}: {
  number: number;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  isLast: boolean;
  isSmLeftCol: boolean;
}) {
  return (
    <div
      className={`group relative px-5 py-5 overflow-hidden border-primary/10 transition-colors hover:bg-[#f4f7ff] sm:px-6 sm:py-7 ${
        isLast ? "" : `border-b lg:border-b-0 lg:border-r${isSmLeftCol ? " sm:border-r" : ""}`
      }`}
    >
      {/* Ghost number — depth texture (desktop only) */}
      <span
        className="absolute -top-2 -right-1 hidden text-[5rem] font-black leading-none select-none tabular-nums pointer-events-none transition-colors group-hover:text-[oklch(55%_0.18_265_/_0.1)] sm:block"
        style={{ color: "oklch(47% 0.22 265 / 0.06)" }}
        aria-hidden
      >
        {String(number).padStart(2, "0")}
      </span>

      <span className="mb-2.5 inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-[#3b82f6]/15 text-primary sm:mb-3">
        <Icon className="size-4" aria-hidden />
      </span>
      <h3 className="text-[14px] font-semibold text-foreground leading-snug relative">{title}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground relative sm:mt-1.5">{description}</p>
    </div>
  );
}
