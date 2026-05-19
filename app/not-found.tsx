import Link from "next/link";
import { headers } from "next/headers";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";
import { extractSubdomain } from "@/lib/db/tenant-resolver";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";

export default async function NotFoundPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  // Detect whether this 404 came from an unknown tenant subdomain.
  // Middleware rewrites unknown-slug.* → /tenant-not-found → notFound(),
  // so the original host header is still present.
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const workspaceSlug = extractSubdomain(host, ROOT_DOMAIN);

  if (workspaceSlug) {
    const proto = process.env.NODE_ENV === "production" ? "https" : "http";
    const tw = t.tenantNotFound;
    return (
      <main
        id="main-content"
        className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-16"
      >
        <div className="flex flex-col items-center text-center max-w-xs w-full">
          <div
            className="size-14 rounded-2xl flex items-center justify-center shadow-sm mb-8"
            style={{ background: "linear-gradient(135deg, #3d46cc, #06b6d4)" }}
            aria-hidden
          >
            <span className="text-white text-xl font-bold tracking-tight">ES</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{tw.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tw.message}</p>
          <div className="mt-8 flex flex-col gap-2.5 w-full">
            <a
              href={`${proto}://${ROOT_DOMAIN}/login`}
              className={cn(buttonVariants(), "w-full")}
            >
              {tw.backToLogin}
            </a>
            <a
              href={`${proto}://${ROOT_DOMAIN}/signup`}
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              {tw.createWorkspace}
            </a>
          </div>
        </div>
        <p className="absolute bottom-8 text-xs text-muted-foreground/50">
          EasySlip HR · Powered by EasySlip
        </p>
      </main>
    );
  }

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
