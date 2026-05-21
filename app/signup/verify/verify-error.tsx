"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  code: string;
  message?: string;
}

export function VerifyError({ code, message }: Props) {
  const t = useT();
  const errors = t.marketing.signup.verify.errors;
  type ErrorKey = keyof typeof errors;
  const key: ErrorKey = code in errors ? (code as ErrorKey) : "DEFAULT";
  const msg = errors[key];

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-xs w-full">
        <div
          className="size-12 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ background: "linear-gradient(135deg, #3d46cc, #06b6d4)" }}
        >
          <span className="text-white text-lg font-bold">ES</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">{msg.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{message ?? msg.body}</p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Link href="/signup" className={buttonVariants({ className: "w-full" })}>
            {t.marketing.signup.verify.tryAgain}
          </Link>
          <Link href="/signin" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            {t.marketing.signup.verify.backToSignIn}
          </Link>
        </div>
      </div>
    </main>
  );
}
