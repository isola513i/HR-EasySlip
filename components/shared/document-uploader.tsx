"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/locale-context";
import { useDocuments, type DocumentRecord } from "@/hooks/use-documents";

interface Props {
  category: string;
  entityType: string;
  entityId: string;
  ownerEmployeeId?: string;
  onUploaded?: (doc: DocumentRecord) => void;
  className?: string;
}

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

export function DocumentUploader({
  category,
  entityType,
  entityId,
  ownerEmployeeId,
  onUploaded,
  className,
}: Props) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload } = useDocuments({ category });
  const [busy, setBusy] = useState(false);

  const handleSelect = () => {
    if (busy) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const doc = await upload({ file, category, entityType, entityId, ownerEmployeeId });
      toast.success(t.documents.uploadSuccess);
      onUploaded?.(doc);
    } catch (err) {
      const code = err instanceof Error ? err.message : "UPLOAD_FAILED";
      toast.error(
        code === "FILE_TOO_LARGE" ? t.documents.fileTooLarge :
        code === "UNSUPPORTED_MEDIA_TYPE" ? t.documents.fileTypeUnsupported :
        t.documents.uploadFailed,
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleSelect}
        disabled={busy}
        className={
          className ??
          "flex h-11 w-full items-center justify-center gap-2 rounded-full border border-dashed border-(--es-accent-300) bg-(--es-accent-50)/60 px-4 text-sm font-semibold text-(--es-accent-700) transition-colors hover:bg-(--es-accent-100) disabled:opacity-60"
        }
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        <span>{busy ? t.documents.uploading : t.documents.upload}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
    </>
  );
}
