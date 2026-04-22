import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-muted/30 px-6 py-12">
      <article className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            นโยบายความเป็นส่วนตัว
          </h1>
          <p className="text-muted-foreground text-sm">
            Privacy Policy — EasySlip HR Internal System
          </p>
          <p className="text-muted-foreground text-xs">
            มีผลบังคับใช้ตั้งแต่ มกราคม 2567 / Effective January 2024
          </p>
        </header>

        <Section title="1. ผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller)">
          <p>บริษัท อีซี่สลิป จำกัด (EasySlip Co., Ltd.)</p>
          <p>629 หมู่ที่ 6 ตำบลบ้านเป็ด อำเภอเมืองขอนแก่น จ.ขอนแก่น 40000</p>
          <p>
            Email:{" "}
            <a href="mailto:contact@easyslip.com" className="text-primary underline underline-offset-4">
              contact@easyslip.com
            </a>{" "}
            | Tel: 02-114-8806
          </p>
          <p className="pt-2 font-medium">
            เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)
          </p>
          <p>ณัฐวุฒิ ภูบุญลาภ</p>
          <p>
            Email:{" "}
            <a href="mailto:nattawut@easyslip.com" className="text-primary underline underline-offset-4">
              nattawut@easyslip.com
            </a>{" "}
            | Tel: 090-270-1908
          </p>
        </Section>

        <Section title="2. ข้อมูลที่เก็บรวบรวม (Data We Collect)">
          <p>
            ระบบ EasySlip HR เก็บรวบรวมข้อมูลส่วนบุคคลของพนักงานเพื่อการบริหารทรัพยากรบุคคลภายในบริษัท:
          </p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>ข้อมูลส่วนตัว: ชื่อ-นามสกุล, รหัสพนักงาน, ตำแหน่ง, แผนก</li>
            <li>ข้อมูลติดต่อ: อีเมล, เบอร์โทรศัพท์</li>
            <li>ข้อมูลการจ้างงาน: วันเริ่มงาน, สถานะการจ้าง, สายบังคับบัญชา</li>
            <li>ข้อมูลการลงเวลา: เวลาเข้า-ออกงาน, พิกัด GPS (เฉพาะ WFH), IP address</li>
            <li>ข้อมูลการลา: ประเภทการลา, วันที่ลา, เหตุผล, ใบรับรองแพทย์</li>
            <li>ข้อมูลทางเทคนิค: Device ID, User Agent, Session tokens</li>
          </ul>
        </Section>

        <Section title="3. วัตถุประสงค์ในการประมวลผล (Processing Purposes)">
          <p className="font-medium">ก. การปฏิบัติตามสัญญาจ้าง</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>บริหารจัดการเวลาทำงานและการลางาน</li>
            <li>ส่งออกข้อมูลไปยังระบบ Empeo เพื่อคำนวณเงินเดือน</li>
            <li>จัดทำรายงานสรุปสำหรับฝ่ายบุคคล</li>
          </ul>
          <p className="pt-2 font-medium">ข. ประโยชน์โดยชอบด้วยกฎหมาย</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>บันทึก Audit Log เพื่อความปลอดภัยของข้อมูล</li>
            <li>วิเคราะห์ข้อมูลเพื่อปรับปรุงระบบ</li>
          </ul>
          <p className="pt-2 font-medium">ค. การปฏิบัติตามกฎหมาย</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>พระราชบัญญัติคุ้มครองแรงงาน</li>
            <li>พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</li>
          </ul>
        </Section>

        <Section title="4. การเปิดเผยข้อมูล (Data Disclosure)">
          <p>ข้อมูลส่วนบุคคลอาจถูกเปิดเผยแก่:</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>พนักงาน HR ที่ได้รับอนุญาต (HR_AUTHORIZED, HRMG) และผู้บริหาร (CEO, CTO, COO)</li>
            <li>ผู้จัดการสายตรง (เฉพาะข้อมูลผู้ใต้บังคับบัญชา)</li>
            <li>ผู้ให้บริการระบบ Cloud (NeonDB, Vercel, Resend)</li>
            <li>หน่วยงานราชการตามที่กฎหมายกำหนด</li>
          </ul>
        </Section>

        <Section title="5. ระยะเวลาการเก็บรักษา (Data Retention)">
          <p>
            เราเก็บรักษาข้อมูลตลอดระยะเวลาที่ท่านเป็นพนักงานของบริษัท
            และเป็นระยะเวลาที่จำเป็นตามกฎหมายหลังจากพ้นสภาพการเป็นพนักงาน
            เมื่อพ้นระยะเวลาดังกล่าว ข้อมูลจะถูกลบหรือทำให้ไม่สามารถระบุตัวบุคคลได้
          </p>
        </Section>

        <Section title="6. สิทธิของเจ้าของข้อมูล (Your Rights)">
          <p>ภายใต้ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) ท่านมีสิทธิ:</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>สิทธิในการเพิกถอนความยินยอม</li>
            <li>สิทธิในการเข้าถึงและขอสำเนาข้อมูล</li>
            <li>สิทธิในการแก้ไขข้อมูลให้ถูกต้อง</li>
            <li>สิทธิในการลบข้อมูล</li>
            <li>สิทธิในการคัดค้านการประมวลผล</li>
            <li>สิทธิในการโอนย้ายข้อมูล</li>
            <li>สิทธิในการระงับการประมวลผล</li>
            <li>สิทธิในการร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล</li>
          </ul>
          <p className="pt-2">
            หากต้องการใช้สิทธิ กรุณาติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) ตามข้อ 1
          </p>
        </Section>

        <Section title="7. การรักษาความปลอดภัย (Security Measures)">
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>การยืนยันตัวตนด้วย Magic Link (Passwordless)</li>
            <li>การควบคุมสิทธิ์ตามบทบาท (RBAC) — ข้อมูลเงินเดือนจำกัดเฉพาะผู้มีสิทธิ์</li>
            <li>Audit Log บันทึกทุกการเปลี่ยนแปลงข้อมูลสำคัญ</li>
            <li>การเข้ารหัสข้อมูลระหว่างการส่ง (HTTPS/TLS)</li>
            <li>Session timeout อัตโนมัติเมื่อไม่ใช้งาน</li>
          </ul>
        </Section>

        <Section title="8. การแจ้งเหตุละเมิด (Breach Notification)">
          <p>
            ในกรณีที่เกิดการละเมิดข้อมูลส่วนบุคคล
            บริษัทจะแจ้งสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลภายใน 72 ชั่วโมง
            และแจ้งเจ้าของข้อมูลโดยตรงหากมีความเสี่ยงสูง
          </p>
        </Section>

        <Section title="9. การเปลี่ยนแปลงนโยบาย (Policy Changes)">
          <p>
            บริษัทสงวนสิทธิ์ในการเปลี่ยนแปลงนโยบายนี้
            โดยจะแจ้งให้ทราบผ่านระบบ EasySlip HR
          </p>
        </Section>

        <footer className="border-t pt-6">
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
            })}
          >
            กลับหน้าหลัก / Back to Home
          </Link>
        </footer>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}
