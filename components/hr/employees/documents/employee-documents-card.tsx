"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DocumentListItem } from "@/components/shared/document-list-item";
import { DocumentUploader } from "@/components/shared/document-uploader";
import { useEmployeeDocuments } from "@/hooks/use-employee-documents";
import type { DocumentRecord } from "@/hooks/use-documents";
import { useT } from "@/lib/i18n/locale-context";

// HR can write all four Employee-scoped categories. leave_attachment /
// time_correction_proof are scoped to a request entity, not an employee,
// so they are surfaced via the manager/employee flows, not here.
const HR_UPLOADABLE_CATEGORIES = ["contract", "certificate", "general"] as const;
const VISIBLE_CATEGORY_ORDER = [
  "contract",
  "certificate",
  "general",
  "leave_attachment",
  "time_correction_proof",
] as const;

type HrCategory = (typeof HR_UPLOADABLE_CATEGORIES)[number];

interface Props {
  employeeId: string;
}

export function EmployeeDocumentsCard({ employeeId }: Props) {
  const t = useT();
  const { documents, isLoading, remove, refetch } = useEmployeeDocuments({ employeeId });
  const [category, setCategory] = useState<HrCategory>("contract");

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

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold">{t.documents.title}</div>
        <div className="text-xs text-muted-foreground">{t.documents.description}</div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {HR_UPLOADABLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={
                "flex-1 min-w-[80px] rounded-full border px-3 py-2 text-xs font-semibold transition-colors " +
                (category === cat
                  ? "border-(--es-accent-600) bg-(--es-accent-50) text-(--es-accent-700)"
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
            return (
              <div key={cat} className="space-y-2">
                <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.documents.category[cat as keyof typeof t.documents.category]}
                </div>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <DocumentListItem
                      key={doc.id}
                      document={doc}
                      canDelete
                      onDelete={handleDelete}
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
