import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchInput({ placeholder, className, value, onChange }: SearchInputProps) {
  return (
    <div className={cn("relative max-w-xs flex-1", className)}>
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-md border border-[var(--es-neutral-300)] bg-card py-2 pl-8 pr-3 text-[13px] focus:border-[var(--es-accent-600)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
    </div>
  );
}
