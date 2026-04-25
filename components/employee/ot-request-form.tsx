"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileTopbar } from "@/components/shared/mobile-topbar";
import { useOTRequests } from "@/hooks/use-ot-requests";

type OTType = "WEEKDAY" | "HOLIDAY";

export function OTRequestForm() {
  const {
    otType, setOTType,
    date, setDate,
    assignedStart, setAssignedStart,
    assignedEnd, setAssignedEnd,
    reason, setReason,
    isSubmitting,
    submit,
  } = useOTRequests();

  const handleSubmit = async () => {
    try {
      const result = await submit();
      if (result) toast.success("ส่งคำขอ OT เรียบร้อย รอการอนุมัติ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ส่งคำขอไม่สำเร็จ");
    }
  };

  const canSubmit =
    date &&
    reason.trim() &&
    (otType === "WEEKDAY" || (assignedStart && assignedEnd));

  return (
    <>
      <MobileTopbar title="OT Request" backHref="/employee/today" />

      <div className="flex flex-col gap-4 p-4">
        {/* OT type tabs */}
        <Tabs value={otType} onValueChange={(v) => setOTType(v as OTType)}>
          <TabsList className="w-full">
            <TabsTrigger value="WEEKDAY" className="flex-1">Weekday OT</TabsTrigger>
            <TabsTrigger value="HOLIDAY" className="flex-1">Holiday OT</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">วันที่</label>
          <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-none bg-transparent text-[15px] font-semibold outline-none"
            />
          </div>
        </div>

        {/* Weekday info / Holiday fields */}
        {otType === "WEEKDAY" ? (
          <div className="rounded-[10px] border border-[var(--es-accent-200)] bg-[var(--es-accent-50)] p-3 text-[12px] text-[var(--es-accent-800)]">
            OT เริ่มนับหลัง 18:00 น. ต้องทำอย่างน้อย 30 นาที คำนวณจากเวลาสแกนออก
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">
                เวลาเริ่ม (ที่กำหนด)
              </label>
              <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
                <input
                  type="datetime-local"
                  value={assignedStart}
                  onChange={(e) => setAssignedStart(e.target.value)}
                  className="w-full border-none bg-transparent text-[15px] font-semibold outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium">
                เวลาจบ (ที่กำหนด)
              </label>
              <div className="rounded-lg border border-[var(--es-neutral-300)] bg-card px-3 py-2">
                <input
                  type="datetime-local"
                  value={assignedEnd}
                  min={assignedStart}
                  onChange={(e) => setAssignedEnd(e.target.value)}
                  className="w-full border-none bg-transparent text-[15px] font-semibold outline-none"
                />
              </div>
            </div>
            <div className="rounded-[10px] border border-[var(--es-accent-200)] bg-[var(--es-accent-50)] p-3 text-[12px] text-[var(--es-accent-800)]">
              หัวหน้ากำหนดเวลาเริ่ม-จบ ชั่วโมง OT จะนับภายในกรอบเวลานี้
            </div>
          </>
        )}

        {/* Reason */}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium">
            เหตุผล
          </label>
          <Textarea
            placeholder="ระบุเหตุผล..."
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          disabled={isSubmitting || !canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting ? "กำลังส่ง..." : "ส่งคำขอ"}
        </Button>
      </div>
    </>
  );
}
