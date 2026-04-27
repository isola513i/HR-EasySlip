"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileText, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";

interface ParsedRow { employeeCode: string; email: string; firstNameTh: string; lastNameTh: string; hireDate: string; [k: string]: string }
interface CreatedRow { rowIndex: number; employeeCode: string; initialPassword: string }
interface ErrorRow { rowIndex: number; field?: string; message: string }

type Step = "upload" | "preview" | "result";

interface Props { open: boolean; onClose: () => void; onDone: () => void }

export function BulkImportDialog({ open, onClose, onDone }: Props) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [csvText, setCsvText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [created, setCreated] = useState<CreatedRow[]>([]);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [copied, setCopied] = useState(false);

  const reset = () => { setStep("upload"); setRows([]); setCsvText(""); setCreated([]); setErrors([]); setCopied(false); };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      const parsed = Papa.parse<ParsedRow>(text, { header: true, skipEmptyLines: true });
      setRows(parsed.data.slice(0, 20));
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", new Blob([csvText], { type: "text/csv" }), "import.csv");
      const res = await fetch("/api/v1/hr/employees/bulk", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      const result = data.data ?? data;
      setCreated(result.created ?? []);
      setErrors(result.errors ?? []);
      setStep("result");
      if (result.created?.length) { toast.success(t.hr.importSuccess); onDone(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : t.hr.importFailed); }
    finally { setIsUploading(false); }
  };

  const handleCopyAll = async () => {
    const text = created.map((r) => `${r.employeeCode}: ${r.initialPassword}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t.common.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.hr.bulkImport}</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-8 opacity-50" />
              <p className="text-sm">{t.hr.uploadCSV}</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            <a href="/etc/employee-import-template.csv" download className="inline-flex items-center gap-1.5 text-xs text-[var(--es-accent-600)] hover:underline">
              <Download className="size-3" /> {t.hr.downloadTemplate}
            </a>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t.hr.preview}: {rows.length} rows</p>
            <div className="overflow-x-auto rounded-lg border text-xs">
              <table className="w-full">
                <thead><tr className="bg-muted">
                  {rows[0] && Object.keys(rows[0]).map((k) => <th key={k} className="px-2 py-1.5 text-left font-medium">{k}</th>)}
                </tr></thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t">
                      {Object.values(row).map((v, j) => <td key={j} className="px-2 py-1.5 truncate max-w-[120px]">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>{t.common.back}</Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? t.hr.importing : `${t.hr.bulkImport} (${rows.length})`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-4">
            {errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">{t.hr.importErrors}</p>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                  {errors.map((e, i) => <div key={i}>Row {e.rowIndex}: {e.field ? `${e.field} — ` : ""}{e.message}</div>)}
                </div>
              </div>
            )}
            {created.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t.hr.importSuccess} ({created.length})</p>
                  <Button variant="ghost" size="sm" onClick={handleCopyAll}>
                    {copied ? <Check className="mr-1 size-3 text-green-600" /> : <Copy className="mr-1 size-3" />}
                    {t.common.copied}
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs space-y-1">
                  {created.map((r) => (
                    <div key={r.employeeCode} className="flex justify-between">
                      <span>{r.employeeCode}</span>
                      <span className="font-semibold">{r.initialPassword}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-destructive">{t.password.tempPasswordWarn}</p>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => { reset(); onClose(); }} className="w-full">{t.password.tempPasswordClose}</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
