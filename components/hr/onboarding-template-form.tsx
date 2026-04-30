"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Template } from "@/hooks/use-onboarding-templates";
import { ONBOARDING_CATEGORIES, CATEGORY_LABELS } from "@/lib/onboarding/constants";
import { useT } from "@/lib/i18n/locale-context";

interface ItemForm { title: string; description: string; category: string }
const emptyItem: ItemForm = { title: "", description: "", category: "general" };

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => Promise<unknown>;
  existing?: Template;
}

export function OnboardingTemplateForm({ open, onClose, onSave, existing }: Props) {
  const t = useT();
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing?.items) {
      setName(existing.name);
      setIsDefault(existing.isDefault);
      setItems(existing.items.map((i) => ({ title: i.title, description: i.description ?? "", category: i.category ?? "general" })));
    } else if (!existing) {
      setName(""); setIsDefault(false); setItems([{ ...emptyItem }]);
    }
  }, [existing, open]);

  const updateItem = (idx: number, field: keyof ItemForm, value: string) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.title.trim());
    if (!name.trim() || validItems.length === 0) {
      setError(t.onboarding.templateRequired);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        isDefault,
        items: validItems.map((item, i) => ({
          title: item.title.trim(), description: item.description.trim() || undefined,
          category: item.category, sortOrder: i,
        })),
      });
      toast.success(existing ? t.onboarding.templateUpdated : t.onboarding.templateCreated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.saveFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? t.onboarding.editTemplate : t.onboarding.createTemplate}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-1">
              <Label>{t.onboarding.templateName} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.onboarding.templateNamePlaceholder} />
            </div>
            <label className="flex items-center gap-2 pb-1 text-sm cursor-pointer">
              <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(v === true)} />
              {t.onboarding.defaultLabel}
            </label>
          </div>

          <div className="space-y-2">
            <Label>{t.onboarding.checklistItems} *</Label>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 rounded-lg border p-2.5">
                <div className="flex-1 space-y-1.5">
                  <Input value={item.title} onChange={(e) => updateItem(idx, "title", e.target.value)} placeholder={t.onboarding.itemTitle} className="text-sm" />
                  <Input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder={t.onboarding.itemDesc} className="text-xs" />
                  <Select value={item.category} onValueChange={(v) => { if (v) updateItem(idx, "category", v); }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue>{(value) => CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS] ?? value}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ONBOARDING_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))} className="mt-1 rounded-md p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, { ...emptyItem }])}>
              <Plus className="mr-1 size-3.5" /> {t.onboarding.addItem}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? t.common.saving : existing ? t.common.save : t.onboarding.createTemplate}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
