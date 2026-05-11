"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, ExternalLink, Trash2, PenLine, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusPill } from "@/components/shared/status-pill";
import { DocumentSignDialog } from "@/components/shared/document-sign-dialog";
import { documentFileHref, type DocumentRecord } from "@/hooks/use-documents";
import { useFormat } from "@/hooks/use-format";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  document: DocumentRecord;
  canDelete: boolean;
  canSign?: boolean;
  onDelete?: (documentId: string) => Promise<void>;
  onSigned?: () => void;
}

function formatSize(bytes: number, t: ReturnType<typeof useT>): string {
  if (bytes < 1024 * 1024) {
    return t.documents.sizeKB.replace("{size}", String(Math.max(1, Math.round(bytes / 1024))));
  }
  return t.documents.sizeMB.replace("{size}", (bytes / (1024 * 1024)).toFixed(1));
}

export function DocumentListItem({ document, canDelete, canSign = false, onDelete, onSigned }: Props) {
  const t = useT();
  const { formatDate } = useFormat();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signOpen, setSignOpen] = useState(false);

  const isImage = document.mime.startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;
  const showSignButton = canSign && document.requiresSignature && !document.signedByMe;
  const showSignedBadge = document.requiresSignature && document.signedByMe;

  const handleDelete = async () => {
    if (!onDelete) return;
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await onDelete(document.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-(--es-shadow-xs)">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--es-accent-50) text-(--es-accent-600)">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground" title={document.filename}>
            {document.filename}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {t.documents.uploadedOn.replace("{date}", formatDate(document.uploadedAt))}
            <span className="mx-1.5">·</span>
            {formatSize(document.size, t)}
          </div>
          {showSignedBadge && (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-(--es-success-700)">
              <CheckCircle2 className="size-3" />
              {t.documents.signature.signedBadge}
            </div>
          )}
          {document.requiresSignature && !document.signedByMe && (
            <div className="mt-1.5">
              <StatusPill tone="warn">{t.documents.signature.required}</StatusPill>
            </div>
          )}
        </div>
        {showSignButton && (
          <button
            type="button"
            onClick={() => setSignOpen(true)}
            className="grid size-11 shrink-0 place-items-center rounded-full text-(--es-accent-600) transition-colors hover:bg-(--es-accent-50)"
            aria-label={t.documents.signature.signAction}
            title={t.documents.signature.signAction}
          >
            <PenLine className="size-4" />
          </button>
        )}
        <a
          href={documentFileHref(document.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-(--es-accent-600)"
          aria-label={t.documents.view}
        >
          <ExternalLink className="size-4" />
        </a>
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-(--es-error-600) disabled:opacity-50"
            aria-label={t.documents.delete}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.documents.delete}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">{t.documents.deleteConfirm}</span>
              <span className="mt-2 block truncate font-mono text-xs text-foreground" title={document.filename}>
                {document.filename}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-(--es-error-600) text-white hover:bg-(--es-error-700)"
            >
              {t.documents.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentSignDialog
        open={signOpen}
        documentId={signOpen ? document.id : null}
        filename={document.filename}
        onClose={() => setSignOpen(false)}
        onSigned={() => onSigned?.()}
      />
    </>
  );
}
