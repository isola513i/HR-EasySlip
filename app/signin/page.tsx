import { SignInForm } from "./signin-form";

export const metadata = {
  title: "เข้าสู่ระบบ · EasySlip HR",
};

export default function SignInPage() {
  return (
    <main className="min-h-dvh grid place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            EasySlip HR
          </h1>
          <p className="text-muted-foreground text-sm">
            กรอกอีเมลบริษัทของคุณ ระบบจะส่ง magic link ให้เข้าสู่ระบบ
          </p>
        </div>
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
