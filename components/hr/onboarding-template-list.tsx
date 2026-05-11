"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboardingTemplates } from "@/hooks/use-onboarding-templates";
import { OnboardingTemplateForm } from "./onboarding-template-form";
import { useT } from "@/lib/i18n/locale-context";
import { ScrollableTable } from "@/components/shared/scrollable-table";

export function OnboardingTemplateList() {
  const t = useT();
  const { templates, isLoading, error, create, update, remove } = useOnboardingTemplates();
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success(t.onboarding.templateDeleted);
    } catch { toast.error(t.common.deleteFailed); }
  };

  const editingTemplate = editId ? templates.find((t) => t.id === editId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t.onboarding.templateList}</h3>
        <Button size="sm" onClick={() => { setEditId(null); setFormOpen(true); }}>
          <Plus className="mr-1.5 size-3.5" /> {t.onboarding.createTemplate}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-(--es-shadow-sm)">
        <ScrollableTable minWidth={480}>
        <div className="grid grid-cols-[1fr_100px_100px_80px] border-b border-border bg-(--es-neutral-50) px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>{t.onboarding.templateName}</span>
          <span>{t.onboarding.items}</span>
          <span>{t.onboarding.defaultLabel}</span>
          <span />
        </div>

        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_100px_100px_80px] items-center border-t border-(--es-neutral-100) px-4 py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}

        {!isLoading && templates.map((tpl) => (
          <div key={tpl.id} className="grid grid-cols-[1fr_100px_100px_80px] items-center border-t border-(--es-neutral-100) px-4 py-3 text-sm">
            <span className="font-medium">{tpl.name}</span>
            <span className="text-muted-foreground">{tpl._count?.items ?? 0} {t.onboarding.items}</span>
            <span>
              {tpl.isDefault && (
                <Badge variant="default" className="gap-1">
                  <Star className="size-3" /> {t.onboarding.defaultLabel}
                </Badge>
              )}
            </span>
            <div className="flex gap-1">
              <button onClick={() => { setEditId(tpl.id); setFormOpen(true); }} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <Pencil className="size-3.5" />
              </button>
              <button onClick={() => handleDelete(tpl.id)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {!isLoading && templates.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t.onboarding.noTemplates}
          </div>
        )}
        </ScrollableTable>
      </div>

      <OnboardingTemplateForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditId(null); }}
        onSave={editId ? (input) => update(editId, input) : create}
        existing={editingTemplate}
      />
    </div>
  );
}
