import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  key: string;
  label: string;
  className?: string;
  cell: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyState?: ReactNode;
  rowClassName?: (row: T) => string | undefined;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyState,
  rowClassName,
}: DataTableProps<T>) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-card hover:bg-card border-border">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "text-muted-foreground font-medium h-10 text-xs uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent border-0">
                <TableCell colSpan={columns.length} className="h-32">
                  {emptyState ?? (
                    <p className="text-center text-muted-foreground text-sm">No results.</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  className={cn(
                    "border-border hover:bg-muted/30 transition-colors duration-100",
                    rowClassName?.(row)
                  )}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn("text-sm py-3", col.className)}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
