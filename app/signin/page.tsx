import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SignInForm } from "./signin-form";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

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
    <main className="relative min-h-dvh grid place-items-center bg-muted/30 px-6 py-12">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.signin.heading}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t.signin.subtitle}
          </p>
        </div>
        {errorMessage ? (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/5 text-destructive space-y-1 rounded-lg border p-4 text-sm"
          >
            <p className="font-medium">{t.signin.errorTitle}</p>
            <p className="text-destructive/90 text-xs leading-relaxed">
              {errorMessage}
            </p>
            {error ? (
              <p className="text-destructive/60 pt-1 font-mono text-[10px]">
                code: {error}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <SignInForm dict={t.signin} />
        </div>
        <p className="text-muted-foreground text-center text-xs">
          {t.signin.noPassword}
        </p>
      </div>
    </main>
  );
}
