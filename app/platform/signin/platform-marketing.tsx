import { Building2, ShieldCheck, Activity } from "lucide-react";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type T = Dictionary["platform"]["signin"];

const MOCK_TENANTS = [
  { name: "Acme Corporation", slug: "acme", status: "ACTIVE" },
  { name: "TechStart Co.", slug: "techstart", status: "TRIAL" },
  { name: "Bright Solutions", slug: "bright", status: "ACTIVE" },
];

const MOCK_AUDIT = [
  { action: "tenant.provision", time: "09:14" },
  { action: "trial.approve", time: "08:52" },
  { action: "platform.signin", time: "08:47" },
];

export function PlatformMarketing({ t }: { t: T }) {
  return (
    <aside
      className="relative hidden overflow-hidden border-l border-white/[0.06] lg:flex lg:w-[55%] lg:flex-col lg:items-center lg:justify-center lg:px-14 lg:py-14"
      style={{ background: "oklch(0.19 0.022 265)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 75% 15%, oklch(0.50 0.20 265 / 0.14), transparent 55%), radial-gradient(ellipse at 15% 90%, oklch(0.40 0.18 280 / 0.08), transparent 50%)",
        }}
      />

      <div className="absolute right-8 top-8 z-10 text-white">
        <LocaleSwitcher />
      </div>

      <div className="relative flex w-full max-w-xl flex-col items-center gap-12 text-white">
        <div className="space-y-4 text-center">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            {t.marketingHeading}
          </h2>
          <p className="mx-auto max-w-md text-base leading-relaxed text-white/70">
            {t.marketingTagline}
          </p>
        </div>
        <PlatformShowcase t={t} />
      </div>
    </aside>
  );
}

function PlatformShowcase({ t }: { t: T }) {
  return (
    <div aria-hidden className="relative w-full">
      <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-black/10 blur-2xl" />
      <TenantListCard t={t} />
      <StatsFloater t={t} />
      <AuditFloater t={t} />
    </div>
  );
}

function TenantListCard({ t }: { t: T }) {
  return (
    <div
      className="relative rounded-2xl p-5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
      style={{ background: "oklch(0.15 0.018 263 / 0.85)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">
            {t.tenantsHeading}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-white/90">{t.tenantsSubheading}</h3>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
          <Building2 className="size-3" />
          12 total
        </div>
      </div>
      <div className="space-y-2">
        {MOCK_TENANTS.map((tenant) => (
          <div
            key={tenant.slug}
            className="flex items-center justify-between rounded-lg px-3 py-2 ring-1 ring-white/8"
            style={{ background: "oklch(0.20 0.015 263 / 0.6)" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="grid size-7 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white/70 uppercase ring-1 ring-white/10"
                style={{ background: "oklch(0.25 0.015 263 / 0.7)" }}
              >
                {tenant.name[0]}
              </span>
              <div>
                <p className="text-[11px] font-semibold text-white/90">{tenant.name}</p>
                <p className="font-mono text-[10px] text-white/40">{tenant.slug}</p>
              </div>
            </div>
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                tenant.status === "ACTIVE"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400",
              ].join(" ")}
            >
              <span
                className={[
                  "size-1.5 rounded-full",
                  tenant.status === "ACTIVE" ? "bg-emerald-400" : "bg-amber-400",
                ].join(" ")}
              />
              {tenant.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsFloater({ t }: { t: T }) {
  return (
    <div
      className="absolute -right-6 -top-8 w-48 rounded-2xl p-3.5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
      style={{ background: "oklch(0.18 0.018 263 / 0.90)" }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-white/40">
        {t.statsHeading}
      </p>
      <div className="mt-2.5 space-y-2.5">
        <StatRow
          icon={<ShieldCheck className="size-3 text-emerald-400" />}
          label={t.statsAuditLogs}
          value="2,841"
        />
        <StatRow
          icon={<Activity className="size-3 text-blue-400" />}
          label={t.statsActiveToday}
          value="9"
        />
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-[10px] text-white/55">
        {icon}
        {label}
      </div>
      <span className="text-[11px] font-semibold text-white/90 tabular-nums">{value}</span>
    </div>
  );
}

function AuditFloater({ t }: { t: T }) {
  return (
    <div
      className="absolute -bottom-6 -left-6 w-60 rounded-2xl p-3 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
      style={{ background: "oklch(0.18 0.018 263 / 0.90)" }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-white/40 mb-2.5">
        {t.recentActivity}
      </p>
      <div className="space-y-2">
        {MOCK_AUDIT.map((e) => (
          <div key={e.action + e.time} className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-blue-300/90 truncate">{e.action}</span>
            <span className="text-[10px] text-white/35 whitespace-nowrap shrink-0">{e.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
