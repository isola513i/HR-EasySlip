import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "เข้าสู่ระบบไม่สำเร็จ · EasySlip HR",
};

const ERROR_COPY: Record<string, { title: string; detail: string }> = {
  AccessDenied: {
    title: "ไม่สามารถเข้าสู่ระบบได้",
    detail:
      "บัญชีของคุณถูกระงับ หรือสถานะพนักงานไม่อยู่ในระบบงานแล้ว (SUSPENDED / RESIGNED / TERMINATED) — กรุณาติดต่อฝ่าย HR",
  },
  Verification: {
    title: "ลิงก์หมดอายุ",
    detail: "Magic link นี้ใช้งานแล้วหรือหมดอายุ กรุณาขอใหม่อีกครั้ง",
  },
  Configuration: {
    title: "การตั้งค่าระบบผิดพลาด",
    detail: "ติดต่อ CTO เพื่อตรวจสอบการตั้งค่า AUTH_* / RESEND_API_KEY",
  },
  Default: {
    title: "เกิดข้อผิดพลาด",
    detail: "ไม่สามารถดำเนินการเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง",
  },
};

interface SignInErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignInErrorPage({
  searchParams,
}: SignInErrorPageProps) {
  const { error } = await searchParams;
  const copy = (error && ERROR_COPY[error]) ?? ERROR_COPY.Default;

  return (
    <main className="min-h-dvh grid place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-destructive text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {copy.detail}
          </p>
          {error ? (
            <p className="text-muted-foreground/80 font-mono text-xs">
              code: {error}
            </p>
          ) : null}
        </div>
        <Link
          href="/signin"
          className={buttonVariants({
            variant: "outline",
            className: "w-full",
          })}
        >
          กลับไปหน้า sign in
        </Link>
      </div>
    </main>
  );
}
