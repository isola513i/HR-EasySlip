"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/shared/signature-pad";
import { apiFetch } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  open: boolean;
  documentId: string | null;
  filename?: string;
  onClose: () => void;
  onSigned: () => void;
}

export function DocumentSignDialog({ open, documentId, filename, onClose, onSigned }: Props) {
  const t = useT();
  const [submitting, setSubmitting] = useState(false);

  const handleSign = async (dataUrl: string) => {
    if (!documentId) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/v1/documents/${documentId}/sign`, {
        method: "POST",
        body: JSON.stringify({ signatureDataUrl: dataUrl }),
      });
      toast.success(t.documents.signature.success);
      onSigned();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.documents.signature.failed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.documents.signature.title}</DialogTitle>
        </DialogHeader>
        {filename && (
          <div className="rounded-lg bg-muted px-3 py-2 text-[12px] text-muted-foreground">
            {filename}
          </div>
        )}
        <SignaturePad onSign={handleSign} onCancel={onClose} submitting={submitting} />
      </DialogContent>
    </Dialog>
  );
}
