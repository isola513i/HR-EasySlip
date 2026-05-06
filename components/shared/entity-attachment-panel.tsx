"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DocumentUploader } from "@/components/shared/document-uploader";
import { DocumentListItem } from "@/components/shared/document-list-item";
import { useDocuments, useEntityDocuments } from "@/hooks/use-documents";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  entityType: string;
  entityId: string;
  category: string;
  title: string;
  description?: string;
  doneLabel: string;
  onDone: () => void;
}

/**
 * Generic post-submit attachment panel. Used by leave (medical cert) and
 * time-correction (proof) flows after the parent record has been created.
 * The shared `useDocuments().remove()` is reused only for its delete call —
 * service-layer canWrite() RBAC gates it per category.
 */
export function EntityAttachmentPanel({
  entityType,
  entityId,
  category,
  title,
  description,
  doneLabel,
  onDone,
}: Props) {
  const t = useT();
  const { documents, refetch } = useEntityDocuments({ entityType, entityId });
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
        <div className="text-sm font-semibold">{title}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>

      <DocumentUploader
        category={category}
        entityType={entityType}
        entityId={entityId}
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
        {doneLabel}
      </Button>
    </div>
  );
}
