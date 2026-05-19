export function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <span className="w-28 text-muted-foreground text-sm shrink-0">{label}</span>
      <span
        className={
          mono
            ? "font-mono text-xs text-foreground/80 break-all"
            : "text-sm text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
