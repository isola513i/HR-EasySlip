import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return { title: t.signin.errorTitle };
}

interface SignInErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignInErrorPage({
  searchParams,
}: SignInErrorPageProps) {
  const { error } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);

  type ErrorKey = keyof typeof t.signin.errorTitles;
  const key: ErrorKey = error && error in t.signin.errorTitles
    ? (error as ErrorKey)
    : "Default";

  return (
    <main className="min-h-dvh grid place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-destructive text-2xl font-semibold tracking-tight">
            {t.signin.errorTitles[key]}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t.signin.errors[key]}
          </p>
          {error ? (
            <p className="text-muted-foreground/80 font-mono text-xs">
              code: {error}
            </p>
          ) : null}
        </div>
        <Link
          href="/signin"
          className={buttonVariants({
            variant: "outline",
            className: "w-full",
          })}
        >
          {t.checkEmail.backToSignIn}
        </Link>
      </div>
    </main>
  );
}
