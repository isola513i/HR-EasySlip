import { Check } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const STARTER_FEATURES = [
  "clockGps",
  "leaveAll",
  "otExpense",
  "approvals",
  "supportEmail",
] as const;

const PRO_FEATURES = [
  "clockGps",
  "leaveAll",
  "otExpense",
  "approvals",
  "empeoExport",
  "reviews",
  "assets",
  "auditLog",
  "onboarding",
  "multiAdmin",
  "supportPriority",
] as const;

const ENTERPRISE_FEATURES = [
  "clockGps",
  "leaveAll",
  "otExpense",
  "approvals",
  "empeoExport",
  "reviews",
  "assets",
  "auditLog",
  "onboarding",
  "multiAdmin",
  "sla",
  "customIntegration",
  "supportDedicated",
] as const;

function CheckItem({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2 text-[13px] leading-relaxed sm:text-sm">
      <Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      <span>{label}</span>
    </li>
  );
}

export default async function PricingTable() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { tiers, features, perMonth, recommended, startTrial, contactSales } =
    t.marketing.pricing;

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-24 bg-gradient-to-b from-white via-[#f4f7ff] to-white py-14 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 id="pricing-heading" className="text-2xl sm:text-4xl font-bold tracking-tight">
            {t.marketing.pricing.title}
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground sm:text-base">{t.marketing.pricing.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 mt-8 sm:mt-12 items-stretch">
          {/* Starter */}
          <div className="order-2 flex flex-col rounded-2xl bg-white border border-primary/10 ring-1 ring-primary/5 p-5 lg:order-1 lg:p-8 shadow-sm">
            <p className="font-bold text-xl">{tiers.starter.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{tiers.starter.description}</p>
            <div className="mt-4 border-t border-border pt-4 sm:mt-6 sm:pt-6">
              <span className="text-4xl font-extrabold tabular-nums" translate="no">฿{tiers.starter.price}</span>
              <span className="text-muted-foreground ml-1 text-sm">{perMonth}</span>
              <p className="text-sm text-muted-foreground mt-1">
                {t.marketing.pricing.upTo} {tiers.starter.maxEmployees}{" "}
                {t.marketing.pricing.employees}
              </p>
            </div>
            <ul className="mt-4 space-y-2 flex-1 sm:mt-6 sm:space-y-3">
              {STARTER_FEATURES.map((k) => (
                <CheckItem key={k} label={features[k]} />
              ))}
            </ul>
            <div className="mt-6 border-t border-border pt-4 sm:mt-8 sm:pt-6">
              <Link
                href="/signup?plan=starter"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-center transition-[background-color,border-color,color,box-shadow] duration-200 ease-out",
                  "[a]:hover:bg-primary [a]:hover:text-primary-foreground [a]:hover:border-primary [a]:hover:shadow-md [a]:hover:shadow-primary/20"
                )}
              >
                {startTrial}
              </Link>
            </div>
          </div>

          {/* Pro — highlighted, shown first on mobile */}
          <div
            className="relative order-1 flex flex-col overflow-hidden rounded-2xl border border-primary/40 p-5 text-primary-foreground shadow-2xl shadow-primary/30 lg:order-2 lg:p-8"
            style={{
              background:
                "linear-gradient(135deg, #1d2bca 0%, #3d46cc 35%, #2f50e6 70%, #06b6d4 130%)",
            }}
          >
            {/* Pattern overlay */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            <div className="relative flex items-center gap-2">
              <p className="font-bold text-xl text-primary-foreground">{tiers.pro.name}</p>
              <span className="text-xs font-semibold bg-white text-primary rounded-full px-2 py-0.5 leading-tight">
                {recommended}
              </span>
            </div>
            <p className="relative text-sm text-white/85 mt-1">{tiers.pro.description}</p>
            <div className="relative mt-4 border-t border-white/25 pt-4 sm:mt-6 sm:pt-6">
              <span className="text-4xl font-extrabold text-white tabular-nums" translate="no">฿{tiers.pro.price}</span>
              <span className="text-white/80 ml-1 text-sm">{perMonth}</span>
              <p className="text-sm text-white/80 mt-1">
                {t.marketing.pricing.upTo} {tiers.pro.maxEmployees}{" "}
                {t.marketing.pricing.employees}
              </p>
            </div>
            <ul className="relative mt-4 space-y-2 flex-1 sm:mt-6 sm:space-y-3">
              {PRO_FEATURES.map((k) => (
                <CheckItem key={k} label={features[k]} />
              ))}
            </ul>
            <div className="relative mt-6 border-t border-white/25 pt-4 sm:mt-8 sm:pt-6">
              <Link href="/signup?plan=pro" target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), "w-full justify-center bg-white text-primary [a]:hover:bg-white motion-safe:[a]:hover:-translate-y-0.5 [a]:hover:shadow-xl [a]:hover:shadow-black/20 shadow-lg shadow-black/10 font-semibold transition-[transform,box-shadow] duration-200 ease-out")}>
                {startTrial}
              </Link>
            </div>
          </div>

          {/* Enterprise */}
          <div className="order-3 flex flex-col rounded-2xl bg-white border border-primary/10 ring-1 ring-primary/5 p-5 lg:p-8 shadow-sm">
            <p className="font-bold text-xl">{tiers.enterprise.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{tiers.enterprise.description}</p>
            <div className="mt-4 border-t border-border pt-4 sm:mt-6 sm:pt-6">
              <span className="text-4xl font-extrabold tabular-nums" translate="no">{tiers.enterprise.price}</span>
              <p className="text-sm text-muted-foreground mt-1">
                {t.marketing.pricing.unlimited} {t.marketing.pricing.employees}
              </p>
            </div>
            <ul className="mt-4 space-y-2 flex-1 sm:mt-6 sm:space-y-3">
              {ENTERPRISE_FEATURES.map((k) => (
                <CheckItem key={k} label={features[k]} />
              ))}
            </ul>
            <div className="mt-6 border-t border-border pt-4 sm:mt-8 sm:pt-6">
              <Link
                href="/signup?plan=enterprise"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-center transition-[background-color,border-color,color,box-shadow] duration-200 ease-out",
                  "[a]:hover:bg-primary [a]:hover:text-primary-foreground [a]:hover:border-primary [a]:hover:shadow-md [a]:hover:shadow-primary/20"
                )}
              >
                {contactSales}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
