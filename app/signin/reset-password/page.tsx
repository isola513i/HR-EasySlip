import type { Metadata } from "next";
import Image from "next/image";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Reset Password — EasySlip HR",
};

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams;

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
          <h1 className="text-xl font-bold tracking-tight">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-center text-sm text-muted-foreground">
            กรอกรหัสผ่านใหม่ของคุณ
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-[var(--es-shadow-sm)]">
          <ResetPasswordForm token={token ?? ""} email={email ?? ""} />
        </div>
      </div>
    </main>
  );
}
