import { cn } from "@/lib/utils";

interface ScrollableTableProps extends React.ComponentProps<"div"> {
  minWidth: number;
}

export function ScrollableTable({ minWidth, className, children, ...props }: ScrollableTableProps) {
  return (
    <div className="overflow-x-auto" {...props}>
      <div className={cn("w-full", className)} style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}
