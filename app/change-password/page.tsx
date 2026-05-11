import type { Metadata } from "next";
import Image from "next/image";
import { getDict } from "@/lib/i18n/get-dict";
import { ChangePasswordForm } from "./change-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.password.changeTitle };
}

export default async function ChangePasswordPage() {
  const { t } = await getDict();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/easyslip-logo.png"
            alt="EasySlip"
            width={48}
            height={48}
            className="rounded-xl"
            priority
          />
          <h1 className="text-xl font-bold tracking-tight">{t.password.changeTitle}</h1>
          <p className="text-center text-sm text-muted-foreground">
            {t.password.mustChange}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-(--es-shadow-sm)">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
