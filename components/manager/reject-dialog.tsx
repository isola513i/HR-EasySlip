"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  employeeName?: string;
}

export function RejectDialog({ open, onClose, onConfirm, employeeName }: Props) {
  const t = useT();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {employeeName ? t.manager.rejectDialogTitle.replace("{name}", employeeName) : t.manager.reject}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder={t.manager.rejectReason}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t.common.cancel}</Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || loading}
            onClick={handleConfirm}
          >
            {loading ? t.manager.rejecting : t.manager.reject}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
