"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiClientError } from "@/lib/api/client";

export function ConsentForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!agreed) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/consent/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json = await res.json();
      if (!json.ok) throw new ApiClientError(json.code, json.error, res.status);
      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save consent");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          นโยบายความเป็นส่วนตัว (PDPA)
        </h1>
        <p className="text-sm text-muted-foreground">
          Privacy Policy — EasySlip HR
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
        <p className="mb-3 font-medium text-foreground">ระบบเก็บรวบรวมข้อมูลต่อไปนี้:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>ข้อมูลส่วนตัว: ชื่อ-นามสกุล, รหัสพนักงาน, ตำแหน่ง, แผนก</li>
          <li>ข้อมูลติดต่อ: อีเมล, เบอร์โทรศัพท์</li>
          <li>ข้อมูลการลงเวลา: เวลาเข้า-ออกงาน, พิกัด GPS, IP address</li>
          <li>ข้อมูลการลา: ประเภทการลา, วันที่, เหตุผล</li>
        </ul>
        <p className="mt-3">
          เพื่อการบริหารทรัพยากรบุคคลและปฏิบัติตามสัญญาจ้าง
          ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
        </p>
        <Link href="/privacy" className="mt-2 inline-block text-xs underline underline-offset-4">
          อ่านนโยบายฉบับเต็ม →
        </Link>
      </div>

      <label className="flex items-start gap-3">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
        <span className="text-sm leading-relaxed">
          ฉันรับทราบและยินยอมให้บริษัทประมวลผลข้อมูลส่วนบุคคลเพื่อการบริหารทรัพยากรบุคคล
        </span>
      </label>

      {error && (
        <p className="text-sm text-[var(--es-error-500)]">{error}</p>
      )}

      <Button className="w-full" size="lg" disabled={!agreed || loading} onClick={handleSubmit}>
        {loading ? "กำลังบันทึก..." : "ยืนยันและเข้าสู่ระบบ"}
      </Button>
    </div>
  );
}
