import type { Metadata } from "next";
import Image from "next/image";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Change Password — EasySlip HR",
};

export default function ChangePasswordPage() {
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
          <h1 className="text-xl font-bold tracking-tight">เปลี่ยนรหัสผ่าน</h1>
          <p className="text-center text-sm text-muted-foreground">
            กรุณาตั้งรหัสผ่านใหม่ก่อนเข้าใช้งานระบบ
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-[var(--es-shadow-sm)]">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
