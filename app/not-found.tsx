import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function NotFoundPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="grid min-h-dvh place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <p className="font-mono text-6xl font-bold text-muted-foreground">404</p>
          <h1 className="text-xl font-semibold tracking-tight">{t.notFoundPage.title}</h1>
          <p className="text-sm text-muted-foreground">{t.notFoundPage.message}</p>
        </div>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t.notFoundPage.goHome}
        </Link>
      </div>
    </main>
  );
}
