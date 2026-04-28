import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { hasActiveConsent } from "@/lib/consent/consent-service";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "PDPA Consent — EasySlip HR" };

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const params = await searchParams;
  const raw = params.callbackUrl ?? "/employee/today";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/employee/today";

  const consented = await hasActiveConsent(session.user.id);
  if (consented) redirect(callbackUrl);

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="relative flex min-h-dvh flex-col lg:flex-row">
      {/* Brand gradient hero — desktop only */}
      <aside
        aria-hidden
        className="es-brand-gradient relative hidden items-center justify-center overflow-hidden px-10 py-16 lg:flex lg:w-[480px] lg:py-0"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.10), transparent 60%)",
          }}
        />
        <div className="relative flex max-w-sm flex-col items-center gap-6 text-center text-white">
          <div className="flex items-center gap-3">
            <Image
              src="/easyslip-logo.png"
              alt="EasySlip"
              width={48}
              height={48}
              className="rounded-xl"
              priority
            />
            <span className="text-2xl font-bold tracking-tight">EasySlip</span>
          </div>

          <div className="flex size-20 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <ShieldCheck className="size-10" aria-hidden />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {t.consent.brandTitle}
            </h2>
            <p className="text-sm leading-relaxed text-white/80">
              {t.consent.brandSubtitle}
            </p>
          </div>

          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider ring-1 ring-white/20">
            {t.consent.brandTagline}
          </span>
        </div>
      </aside>

      {/* Form panel */}
      <div className="relative flex flex-1 items-start justify-center bg-muted/30 px-6 py-12 lg:items-center lg:py-16">
        <div className="absolute right-4 top-4">
          <LocaleSwitcher />
        </div>
        <ConsentForm callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
