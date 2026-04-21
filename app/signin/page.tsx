import { SignInForm } from "./signin-form";

export const metadata = {
  title: "เข้าสู่ระบบ · EasySlip HR",
};

const ERROR_COPY: Record<string, string> = {
  AccessDenied:
    "บัญชีของคุณถูกระงับ หรือสถานะพนักงานไม่อยู่ในระบบงานแล้ว (SUSPENDED / RESIGNED / TERMINATED) — กรุณาติดต่อฝ่าย HR",
  Verification:
    "Magic link นี้ใช้งานแล้วหรือหมดอายุ กรุณาขอใหม่อีกครั้ง",
  Configuration:
    "การตั้งค่าระบบผิดพลาด ติดต่อ CTO เพื่อตรวจสอบค่า AUTH_* / RESEND_API_KEY",
  Default: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง",
};

interface SignInPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams;
  const errorMessage = error
    ? (ERROR_COPY[error] ?? ERROR_COPY.Default)
    : null;

  return (
    <main className="min-h-dvh grid place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            EasySlip HR
          </h1>
          <p className="text-muted-foreground text-sm">
            กรอกอีเมลบริษัทของคุณ ระบบจะส่ง magic link ให้เข้าสู่ระบบ
          </p>
        </div>
        {errorMessage ? (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/5 text-destructive space-y-1 rounded-lg border p-4 text-sm"
          >
            <p className="font-medium">เข้าสู่ระบบไม่สำเร็จ</p>
            <p className="text-destructive/90 text-xs leading-relaxed">
              {errorMessage}
            </p>
            {error ? (
              <p className="text-destructive/60 pt-1 font-mono text-[10px]">
                code: {error}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <SignInForm />
        </div>
        <p className="text-muted-foreground text-center text-xs">
          ไม่มีรหัสผ่าน — เข้าผ่านอีเมลเท่านั้น
        </p>
      </div>
    </main>
  );
}
