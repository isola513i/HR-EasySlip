"use client";

import { useState, useTransition } from "react";
import { Shield, ShieldOff, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";
import { decideImpersonationRequest } from "./actions";
import { toast } from "sonner";

interface Props {
  requestId: string;
  status: string;
  isExpired: boolean;
  platformEmail: string;
  tenantName: string;
  reason: string;
  expectedDurationMin: number;
  expiresAt: string;
  initialAction?: "approve" | "reject";
}

export function ApproveClient({
  requestId,
  status: initialStatus,
  isExpired,
  platformEmail,
  tenantName,
  reason,
  expectedDurationMin,
  expiresAt,
  initialAction,
}: Props) {
  const t = useT();
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const expiresDate = new Date(expiresAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

  function decide(action: "approve" | "reject") {
    startTransition(async () => {
      const result = await decideImpersonationRequest(requestId, action);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setStatus(action === "approve" ? "APPROVED" : "REJECTED");
        toast.success(action === "approve" ? "อนุมัติคำขอแล้ว / Request approved" : "ปฏิเสธคำขอแล้ว / Request rejected");
      }
    });
  }

  // Show result screen
  if (status === "APPROVED") {
    return (
      <div className="max-w-md w-full text-center space-y-4">
        <CheckCircle2 className="size-12 text-emerald-500 mx-auto" />
        <h1 className="text-xl font-semibold">อนุมัติแล้ว / Approved</h1>
        <p className="text-sm text-muted-foreground">
          ทีม Support สามารถเข้าถึงระบบได้แล้ว กิจกรรมทั้งหมดจะถูกบันทึกและแสดงในประวัติการตรวจสอบ
        </p>
        <p className="text-sm text-muted-foreground">
          Support has been granted access. All activity will be logged and visible in your audit log.
        </p>
      </div>
    );
  }

  if (status === "REJECTED" || status === "CANCELLED") {
    return (
      <div className="max-w-md w-full text-center space-y-4">
        <XCircle className="size-12 text-red-500 mx-auto" />
        <h1 className="text-xl font-semibold">ปฏิเสธแล้ว / Rejected</h1>
        <p className="text-sm text-muted-foreground">คำขอถูกปฏิเสธ ทีม Support จะไม่สามารถเข้าถึงระบบได้</p>
        <p className="text-sm text-muted-foreground">The request has been rejected. Support will not have access.</p>
      </div>
    );
  }

  if (isExpired || status === "EXPIRED") {
    return (
      <div className="max-w-md w-full text-center space-y-4">
        <Clock className="size-12 text-amber-500 mx-auto" />
        <h1 className="text-xl font-semibold">คำขอหมดอายุ / Request Expired</h1>
        <p className="text-sm text-muted-foreground">คำขอนี้หมดอายุแล้ว ทีม Support ต้องส่งคำขอใหม่</p>
        <p className="text-sm text-muted-foreground">This request has expired. Support must submit a new request.</p>
      </div>
    );
  }

  if (status === "CONSUMED") {
    return (
      <div className="max-w-md w-full text-center space-y-4">
        <CheckCircle2 className="size-12 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-semibold">ใช้งานแล้ว / Already Used</h1>
        <p className="text-sm text-muted-foreground">คำขอนี้ถูกใช้งานแล้ว</p>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-6">
      <div className="text-center space-y-2">
        <Shield className="size-10 text-amber-500 mx-auto" />
        <h1 className="text-xl font-semibold">คำขอเข้าถึงระบบ</h1>
        <p className="text-sm font-medium">Platform Support Access Request</p>
        <p className="text-xs text-muted-foreground">{tenantName}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Row label="Support Email" value={platformEmail} />
        <Row label="เหตุผล / Reason" value={reason} />
        <Row label="ระยะเวลา / Duration" value={`${expectedDurationMin} นาที / min`} />
        <Row label="คำขอหมดอายุ / Expires" value={expiresDate} />
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
        ⚠️ ถ้าคุณไม่ได้คาดหวังคำขอนี้ กรุณากด &quot;ปฏิเสธ&quot; ทันที
        <br />If you did not expect this request, click Reject immediately.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => decide("reject")}
          disabled={isPending}
          variant="outline"
          className="border-red-500/40 text-red-600 hover:bg-red-500/10"
        >
          <ShieldOff className="size-4 mr-1.5" />
          ปฏิเสธ / Reject
        </Button>
        <Button
          onClick={() => decide("approve")}
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          <CheckCircle2 className="size-4 mr-1.5" />
          อนุมัติ / Approve
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t.common.appName} · Security notification
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
