"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDocuments, type DocumentRecord } from "@/hooks/use-documents";
import { DocumentListItem } from "@/components/shared/document-list-item";
import { DocumentUploader } from "@/components/shared/document-uploader";
import { useT } from "@/lib/i18n/locale-context";

const UPLOADABLE_CATEGORIES = ["general", "certificate"] as const;
const VISIBLE_CATEGORY_ORDER = [
  "contract",
  "certificate",
  "general",
  "leave_attachment",
  "time_correction_proof",
] as const;

type UploadableCategory = (typeof UPLOADABLE_CATEGORIES)[number];

interface Props {
  employeeId: string;
}

export function DocumentsSection({ employeeId }: Props) {
  const t = useT();
  const { documents, isLoading, remove, refetch } = useDocuments();
  const [category, setCategory] = useState<UploadableCategory>("general");

  const grouped = useMemo(() => {
    const map = new Map<string, DocumentRecord[]>();
    for (const doc of documents) {
      const list = map.get(doc.category) ?? [];
      list.push(doc);
      map.set(doc.category, list);
    }
    return map;
  }, [documents]);

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success(t.documents.deleted);
    } catch {
      toast.error(t.documents.uploadFailed);
    }
  };

  const canDelete = (cat: string): boolean =>
    cat !== "contract"; // contracts are HR-only writes

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t.documents.description}</p>

      <div className="space-y-2">
        <div className="flex gap-2">
          {UPLOADABLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={
                "flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition-colors " +
                (category === cat
                  ? "border-[var(--es-accent-600)] bg-[var(--es-accent-50)] text-[var(--es-accent-700)]"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40")
              }
            >
              {t.documents.category[cat]}
            </button>
          ))}
        </div>
        <DocumentUploader
          category={category}
          entityType="Employee"
          entityId={employeeId}
          ownerEmployeeId={employeeId}
          onUploaded={() => void refetch()}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
          {t.documents.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {VISIBLE_CATEGORY_ORDER.map((cat) => {
            const docs = grouped.get(cat);
            if (!docs?.length) return null;
            const label = t.documents.category[cat as keyof typeof t.documents.category];
            return (
              <div key={cat} className="space-y-2">
                <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </div>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <DocumentListItem
                      key={doc.id}
                      document={doc}
                      canDelete={canDelete(cat)}
                      onDelete={canDelete(cat) ? handleDelete : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
