interface ReadFieldProps {
  label: string;
  value?: string | null;
}

export function ReadField({ label, value }: ReadFieldProps) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{value && value.trim() ? value : "—"}</div>
    </div>
  );
}
