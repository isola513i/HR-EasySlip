"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DocumentUploader } from "@/components/shared/document-uploader";
import { DocumentListItem } from "@/components/shared/document-list-item";
import { useDocuments, useEntityDocuments } from "@/hooks/use-documents";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  leaveId: string;
  onDone: () => void;
}

/**
 * Shown after a leave request is created, so the user can attach a
 * medical certificate to that specific LeaveRequest. Uploads + list use
 * the polymorphic Document API (entityType=LeaveRequest).
 */
export function LeaveAttachmentPanel({ leaveId, onDone }: Props) {
  const t = useT();
  const { documents, refetch } = useEntityDocuments({
    entityType: "LeaveRequest",
    entityId: leaveId,
  });
  // Reuse the shared remove() — RBAC at the API enforces "owner can write
  // leave_attachment" so this works without a leave-specific endpoint.
  const { remove } = useDocuments();

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      await refetch();
      toast.success(t.documents.deleted);
    } catch {
      toast.error(t.documents.uploadFailed);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--es-shadow-sm)]">
      <div>
        <div className="text-sm font-semibold">{t.leave.attachmentPanelTitle}</div>
        <div className="text-xs text-muted-foreground">{t.leave.attachmentPanelDesc}</div>
      </div>

      <DocumentUploader
        category="leave_attachment"
        entityType="LeaveRequest"
        entityId={leaveId}
        onUploaded={() => void refetch()}
      />

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocumentListItem
              key={doc.id}
              document={doc}
              canDelete
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full"
        onClick={onDone}
      >
        {t.leave.attachmentDone}
      </Button>
    </div>
  );
}
