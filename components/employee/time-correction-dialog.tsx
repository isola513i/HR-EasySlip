"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  open: boolean;
  onClose: () => void;
  /** YYYY-MM-DD of the day being corrected */
  date: string;
  /** Initial clock type guess based on which entry the user tapped */
  initialClockType?: "IN" | "OUT";
}

export function TimeCorrectionDialog({ open, onClose, date, initialClockType = "IN" }: Props) {
  const t = useT();
  const dict = t.timesheet;
  const [clockType, setClockType] = useState<"IN" | "OUT">(initialClockType);
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setReason(""); setSubmitting(false); };

  async function handleSubmit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/attendance/adjustment", {
        method: "POST",
        body: JSON.stringify({
          clockType,
          requestedAt: new Date(`${date}T${time}:00.000+07:00`).toISOString(),
          reason: reason.trim(),
        }),
      });
      toast.success(dict.correctionSuccess);
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : dict.correctionFailed);
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{dict.correctionTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-[12px]">{dict.correctionClockType}</Label>
            <Tabs value={clockType} onValueChange={(v) => setClockType(v as "IN" | "OUT")}>
              <TabsList className="mt-1 w-full">
                <TabsTrigger value="IN" className="flex-1">
                  {(dict.locations as Record<string, string>).OFFICE ?? ""} • Clock-in
                </TabsTrigger>
                <TabsTrigger value="OUT" className="flex-1">Clock-out</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <Label htmlFor="correction-time" className="text-[12px]">{dict.correctionTime}</Label>
            <Input
              id="correction-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 h-11 tabular-nums"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{date}</p>
          </div>

          <div>
            <Label htmlFor="correction-reason" className="text-[12px]">{dict.correctionReason}</Label>
            <Textarea
              id="correction-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={dict.correctionReasonPlaceholder}
              maxLength={500}
              rows={3}
              className="mt-1"
            />
          </div>

          <Button
            type="button"
            className="w-full rounded-full"
            size="lg"
            disabled={submitting || !reason.trim()}
            onClick={handleSubmit}
          >
            {submitting ? t.common.saving : dict.correctionSubmit}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
