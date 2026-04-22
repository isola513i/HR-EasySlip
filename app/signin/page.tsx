import type { Metadata } from "next";
import Image from "next/image";
import { Mail } from "lucide-react";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { SignInForm } from "./signin-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return { title: t.signin.pageTitle };
}

interface SignInPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);

  const errorMessage = error
    ? (t.signin.errors[error as keyof typeof t.signin.errors] ??
      t.signin.errors.Default)
    : null;

  return (
    <main className="relative flex min-h-dvh flex-col lg:flex-row">
      {/* Brand gradient hero — left/top panel */}
      <div className="es-brand-gradient relative flex items-center justify-center px-6 py-16 lg:w-[480px] lg:py-0">
        {/* Subtle radial highlight */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.08), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-3 text-white">
          <div className="flex items-center gap-3">
            <Image
              src="/easyslip-logo.png"
              alt="EasySlip"
              width={56}
              height={56}
              className="rounded-xl"
              priority
            />
            <span className="text-3xl font-bold tracking-tight">EasySlip</span>
          </div>
          <span className="text-sm text-white/80">HR Portal · Internal</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="absolute right-4 top-4">
          <LocaleSwitcher />
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {t.signin.heading}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.signin.subtitle}
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="space-y-1 rounded-lg border border-destructive/40 bg-[var(--es-error-50)] p-4 text-sm text-destructive"
            >
              <p className="font-medium">{t.signin.errorTitle}</p>
              <p className="text-xs leading-relaxed opacity-90">
                {errorMessage}
              </p>
              {error ? (
                <p className="pt-1 font-mono text-[10px] opacity-60">
                  code: {error}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border bg-card p-6 shadow-[var(--es-shadow-sm)]">
            <SignInForm dict={t.signin} />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <Mail className="mr-1 inline size-3" />
            {t.signin.noPassword}
          </p>
        </div>
      </div>
    </main>
  );
}
