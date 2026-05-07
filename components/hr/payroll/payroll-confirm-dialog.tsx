"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  loadingLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PayrollConfirmDialog({
  open, title, body, confirmLabel, loadingLabel, loading, onClose, onConfirm,
}: Props) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{body}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t.common.cancel}</Button>
          <Button disabled={loading} onClick={onConfirm}>
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
