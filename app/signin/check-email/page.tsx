import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "เช็กอีเมล · EasySlip HR",
};

export default function CheckEmailPage() {
  return (
    <main className="min-h-dvh grid place-items-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          ตรวจสอบอีเมลของคุณ
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          เราส่ง magic link ไปยังอีเมลที่คุณกรอกแล้ว กดลิงก์ในอีเมลเพื่อเข้าสู่ระบบ
          ลิงก์จะหมดอายุภายใน 24 ชั่วโมง
        </p>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">ไม่พบอีเมล?</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-left">
            <li>ตรวจสอบในกล่องจดหมายขยะ / Spam</li>
            <li>รอสักครู่ — บางครั้งอาจใช้เวลา 1–2 นาที</li>
            <li>ลองส่งใหม่อีกครั้ง</li>
          </ul>
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
