"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
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
  body: ReactNode;
  confirmLabel: string;
  loadingLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** When true, signals an irreversible action: warning icon + amber confirm button. */
  destructive?: boolean;
}

export function PayrollConfirmDialog({
  open, title, body, confirmLabel, loadingLabel, loading, onClose, onConfirm, destructive,
}: Props) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--es-warn-500)]/15 text-[var(--es-warn-700)]">
                <AlertTriangle className="size-4" />
              </span>
            )}
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">{body}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t.common.cancel}</Button>
          <Button
            disabled={loading}
            onClick={onConfirm}
            className={destructive
              ? "bg-[var(--es-warn-500)] text-white hover:bg-[var(--es-warn-500)]/90 focus-visible:ring-[var(--es-warn-500)]/30"
              : undefined}
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
