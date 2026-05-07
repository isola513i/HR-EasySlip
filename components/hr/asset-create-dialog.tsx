"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionLabel } from "@/components/shared/section-label";
import { useAssets, type AssetType } from "@/hooks/use-assets";
import { useT } from "@/lib/i18n/locale-context";

const TYPES: AssetType[] = ["LAPTOP", "PHONE", "MONITOR", "HEADSET", "TABLET", "OTHER"];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AssetCreateDialog({ open, onClose }: Props) {
  const t = useT();
  const { createAsset } = useAssets();
  const [type, setType] = useState<AssetType>("LAPTOP");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType("LAPTOP");
    setBrand("");
    setModel("");
    setSerialNumber("");
    setPurchaseDate("");
    setNotes("");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createAsset({
        type,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        purchaseDate: purchaseDate || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(t.hr.assets.createSuccess);
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.hr.assets.createFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.hr.assets.createTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <SectionLabel htmlFor="asset-type">{t.hr.assets.type}</SectionLabel>
            <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
              <SelectTrigger id="asset-type" className="h-10 w-full">
                <SelectValue>{(value) => t.hr.assets.types[value as AssetType]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((tp) => (
                  <SelectItem key={tp} value={tp}>{t.hr.assets.types[tp]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SectionLabel htmlFor="asset-brand">{t.hr.assets.brand}</SectionLabel>
              <Input id="asset-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Apple, Dell..." />
            </div>
            <div>
              <SectionLabel htmlFor="asset-model">{t.hr.assets.model}</SectionLabel>
              <Input id="asset-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="MacBook Pro 14..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SectionLabel htmlFor="asset-serial">{t.hr.assets.serial}</SectionLabel>
              <Input id="asset-serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="font-mono" />
            </div>
            <div>
              <SectionLabel htmlFor="asset-purchase">{t.hr.assets.purchaseDate}</SectionLabel>
              <Input id="asset-purchase" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
          </div>
          <div>
            <SectionLabel htmlFor="asset-notes">{t.hr.assets.notes}</SectionLabel>
            <Textarea id="asset-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>{t.common.cancel}</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? t.common.saving : t.hr.assets.createBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
