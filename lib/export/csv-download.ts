export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(csv: string, filename: string): void {
  downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function rowsToCSV(header: readonly string[], rows: readonly (readonly (string | number | null | undefined)[])[]): string {
  const escape = (v: string | number | null | undefined): string =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [header.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}
