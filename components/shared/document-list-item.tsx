"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, ExternalLink, Trash2 } from "lucide-react";
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
import { documentFileHref, type DocumentRecord } from "@/hooks/use-documents";
import { useFormat } from "@/hooks/use-format";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  document: DocumentRecord;
  canDelete: boolean;
  onDelete?: (documentId: string) => Promise<void>;
}

function formatSize(bytes: number, t: ReturnType<typeof useT>): string {
  if (bytes < 1024 * 1024) {
    return t.documents.sizeKB.replace("{size}", String(Math.max(1, Math.round(bytes / 1024))));
  }
  return t.documents.sizeMB.replace("{size}", (bytes / (1024 * 1024)).toFixed(1));
}

export function DocumentListItem({ document, canDelete, onDelete }: Props) {
  const t = useT();
  const { formatDate } = useFormat();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isImage = document.mime.startsWith("image/");
  const Icon = isImage ? ImageIcon : FileText;

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
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--es-shadow-xs)]">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--es-accent-50)] text-[var(--es-accent-600)]">
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
        </div>
        <a
          href={documentFileHref(document.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-[var(--es-accent-600)]"
          aria-label={t.documents.view}
        >
          <ExternalLink className="size-4" />
        </a>
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-[var(--es-error-600)] disabled:opacity-50"
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
            <AlertDialogDescription>{t.documents.deleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[var(--es-error-600)] text-white hover:bg-[var(--es-error-700)]"
            >
              {t.documents.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
