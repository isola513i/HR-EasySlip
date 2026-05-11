"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
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
import { useProfilePicture } from "@/hooks/use-profile-picture";
import { useT } from "@/lib/i18n/locale-context";

interface ProfilePictureUploaderProps {
  hasPicture: boolean;
  onChanged: () => void;
}

export function ProfilePictureUploader({ hasPicture, onChanged }: ProfilePictureUploaderProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isUploading, upload, remove } = useProfilePicture();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSelect = () => {
    if (busy || isUploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      await upload(file);
      onChanged();
      toast.success(t.profile.profilePictureUploaded);
    } catch (err) {
      const code = err instanceof Error ? err.message : "UPLOAD_FAILED";
      toast.error(
        code === "FILE_TOO_LARGE" ? t.profile.fileTooLarge :
        code === "UNSUPPORTED_MEDIA_TYPE" ? t.profile.fileTypeUnsupported :
        t.profile.fileUploadFailed,
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setConfirmOpen(false);
    setBusy(true);
    try {
      await remove();
      onChanged();
      toast.success(t.profile.profilePictureRemoved);
    } catch {
      toast.error(t.profile.fileUploadFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleSelect}
        disabled={busy || isUploading}
        aria-label={t.profile.profilePictureChange}
        className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full border-2 border-card bg-(--es-accent-600) text-white shadow-(--es-shadow-sm) transition-colors hover:bg-(--es-accent-700) disabled:opacity-60"
      >
        <Camera className="size-4" strokeWidth={2} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      {hasPicture && (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={busy || isUploading}
          className="mt-3 text-xs font-medium text-muted-foreground hover:text-(--es-error-600) disabled:opacity-60"
        >
          {t.profile.profilePictureRemove}
        </button>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.profile.profilePictureRemove}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.profile.profilePictureRemoveConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-(--es-error-600) text-white hover:bg-(--es-error-700)"
            >
              {t.profile.profilePictureRemove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
