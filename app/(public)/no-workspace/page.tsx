import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.noWorkspace.heading };
}

export default async function NoWorkspacePage() {
  const t = getDictionary(await getLocale());
  const tw = t.noWorkspace;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
      <div className="flex flex-col items-center text-center max-w-xs w-full space-y-6">
        <div
          className="size-14 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ background: "linear-gradient(135deg, #3d46cc, #06b6d4)" }}
          aria-hidden
        >
          <span className="text-white text-xl font-bold tracking-tight">ES</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{tw.heading}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{tw.message}</p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Link
            href="/signup"
            className={buttonVariants({ className: "w-full" })}
          >
            {tw.startTrial}
          </Link>
          <Link
            href="/signin"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            {tw.backToSignIn}
          </Link>
        </div>
      </div>

      <p className="absolute bottom-8 text-xs text-muted-foreground/50">
        EasySlip HR · Powered by EasySlip
      </p>
    </main>
  );
}
