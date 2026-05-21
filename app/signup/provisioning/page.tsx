"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type Status = "PROVISIONING" | "READY" | "FAILED" | "loading";

export default function ProvisioningPage() {
  const router = useRouter();
  const params = useSearchParams();
  const signupId = params.get("id");

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signupId) {
      setStatus("FAILED");
      setError("Missing signup ID");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // ~2 min at 3s intervals

    async function poll() {
      while (!cancelled && attempts < MAX_ATTEMPTS) {
        try {
          const res = await fetch(`/api/marketing/signup/status?id=${signupId}`);
          const json = await res.json() as { data?: { status: string; slug?: string | null; error?: string | null } };
          const data = json.data;

          if (!data) break;

          if (data.status === "READY" && data.slug) {
            if (!cancelled) router.push(`/${data.slug}/signin?welcome=1`);
            return;
          }
          if (data.status === "FAILED") {
            if (!cancelled) {
              setStatus("FAILED");
              setError(data.error ?? "Provisioning failed");
            }
            return;
          }
        } catch {}

        await new Promise((r) => setTimeout(r, 3_000));
        attempts++;
      }

      if (!cancelled) {
        setStatus("FAILED");
        setError("Timed out waiting for workspace");
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [signupId, router]);

  if (status === "FAILED") {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-xs w-full">
          <Logo />
          <div className="space-y-2">
            <h1 className="text-lg font-semibold">สร้าง workspace ไม่สำเร็จ</h1>
            <p className="text-sm text-muted-foreground">{error ?? "กรุณาลองใหม่หรือติดต่อ support"}</p>
          </div>
          <Link href="/signup" className={buttonVariants({ className: "w-full" })}>
            สมัครใหม่
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        <Logo pulse />
        <div className="space-y-1">
          <p className="text-base font-semibold">กำลังสร้าง workspace…</p>
          <p className="text-sm text-muted-foreground">อาจใช้เวลา 20–40 วินาที กรุณารอสักครู่</p>
        </div>
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: "70%", animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }}
          />
        </div>
      </div>
    </main>
  );
}

function Logo({ pulse }: { pulse?: boolean }) {
  return (
    <div
      className={`size-12 rounded-2xl flex items-center justify-center shadow-sm${pulse ? " animate-pulse" : ""}`}
      style={{ background: "linear-gradient(135deg, #3d46cc, #06b6d4)" }}
    >
      <span className="text-white text-lg font-bold">ES</span>
    </div>
  );
}
