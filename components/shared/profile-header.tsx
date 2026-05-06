import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  name: string;
  initial?: string;
  meta?: string;
  className?: string;
}

export function ProfileHeader({ name, initial, meta, className }: ProfileHeaderProps) {
  const letter = (initial ?? name.charAt(0) ?? "U").toUpperCase();
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="grid size-20 place-items-center rounded-full bg-[var(--es-accent-600)] text-3xl font-bold text-white shadow-[var(--es-shadow-md)]">
        {letter}
      </div>
      <div className="mt-3 text-lg font-bold text-foreground">{name || "—"}</div>
      {meta && (
        <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {meta}
        </div>
      )}
    </div>
  );
}
