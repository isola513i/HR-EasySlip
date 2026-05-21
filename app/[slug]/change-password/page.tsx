import type { Metadata } from "next";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getControlPlane } from "@/lib/db/control-plane";
import { getDict } from "@/lib/i18n/get-dict";
import { ChangePasswordForm } from "./change-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.password.changeTitle };
}

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, { t }, session] = await Promise.all([params, getDict(), auth()]);

  let hasExistingPassword = true;
  if (session?.user?.id) {
    const u = await getControlPlane().user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    hasExistingPassword = Boolean(u?.passwordHash);
  }

  const firstTimeSetup = !hasExistingPassword;
  const email = session?.user?.email ?? "";

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-12 pt-16 sm:pt-24">
        <header className="flex items-center justify-between">
          <Image
            src="/easyslip-logo.png"
            alt="EasySlip"
            width={32}
            height={32}
            className="rounded-md"
            priority
          />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
            {slug}
          </span>
        </header>

        <div className="mt-14 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {firstTimeSetup ? t.password.setupTitle : t.password.changeTitle}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {firstTimeSetup ? t.password.setupSubtitle : t.password.mustChange}
            {email && (
              <>
                {" "}
                <span className="font-medium text-foreground/90">{email}</span>
              </>
            )}
          </p>
        </div>

        <div className="mt-10 flex-1">
          <ChangePasswordForm firstTimeSetup={firstTimeSetup} />
        </div>

        <footer className="mt-12 flex items-center justify-between border-t border-border/60 pt-5 text-xs text-muted-foreground">
          <a
            href="/api/auth/signout"
            className="transition-colors hover:text-foreground"
          >
            {t.common.signOut}
          </a>
          <span>EasySlip HR</span>
        </footer>
      </div>
    </main>
  );
}
