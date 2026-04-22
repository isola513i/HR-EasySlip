import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return { title: t.checkEmail.pageTitle };
}

export default async function CheckEmailPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="min-h-dvh grid place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.checkEmail.heading}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t.checkEmail.instruction}
        </p>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">{t.checkEmail.notFound}</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-left">
            <li>{t.checkEmail.checkSpam}</li>
            <li>{t.checkEmail.waitMoment}</li>
            <li>{t.checkEmail.tryAgain}</li>
          </ul>
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
