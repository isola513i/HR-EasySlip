import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "403 Forbidden" };
}

export default async function ForbiddenPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="min-h-dvh grid place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground font-mono text-6xl font-bold">
            403
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            {t.errors.forbidden}
          </h1>
        </div>
        <Link
          href="/"
          className={buttonVariants({
            variant: "outline",
            className: "w-full",
          })}
        >
          {t.common.back}
        </Link>
      </div>
    </main>
  );
}
