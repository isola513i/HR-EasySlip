import { cn } from "@/lib/utils";

export interface FeatureItem {
  title: string;
  description?: string;
}

interface FeatureListProps {
  items: FeatureItem[];
  className?: string;
}

export function FeatureList({ items, className }: FeatureListProps) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item.title} className="flex gap-3">
          <span
            aria-hidden
            className="mt-2 size-1.5 shrink-0 rounded-full bg-(--es-accent-600)"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">{item.title}</div>
            {item.description && (
              <div className="text-xs text-(--es-accent-700)/80 mt-0.5">
                {item.description}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
