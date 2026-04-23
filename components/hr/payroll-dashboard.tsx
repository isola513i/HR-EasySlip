"use client";

import { useState } from "react";
import { Download, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/shared/status-pill";
import { usePayroll, type PayrollCycle } from "@/hooks/use-payroll";

const YEARS = [2025, 2026, 2027];

const STATUS_TONE = {
  OPEN: "info",
  LOCKED: "warn",
  EXPORTED: "success",
} as const;

function formatPeriod(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function PayrollDashboard() {
  const {
    cycles, isLoading, error, year, setYear,
    lockCycle, downloadTimestamps, downloadCashout,
  } = usePayroll();

  const [lockTarget, setLockTarget] = useState<PayrollCycle | null>(null);
  const [locking, setLocking] = useState(false);

  const handleLock = async () => {
    if (!lockTarget) return;
    setLocking(true);
    try {
      await lockCycle(lockTarget.id);
      toast.success(`Cycle ${MONTH_NAMES[lockTarget.month - 1]} locked`);
      setLockTarget(null);
    } catch {
      toast.error("Failed to lock cycle");
    } finally {
      setLocking(false);
    }
  };

  const handleDownloadTimestamps = async (id: string) => {
    try {
      await downloadTimestamps(id);
      toast.success("Timestamps downloaded");
    } catch {
      toast.error("Failed to download timestamps");
    }
  };

  const handleDownloadCashout = async () => {
    try {
      await downloadCashout(year);
      toast.success("Cashout report downloaded");
    } catch {
      toast.error("Failed to download cashout report");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {YEARS.map((y) => (
            <Button key={y} variant={year === y ? "default" : "outline"} size="sm" onClick={() => setYear(y)}>
              {y}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={handleDownloadCashout}>
          <Download className="mr-1.5 size-4" /> Cashout Export ({year})
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center text-[var(--es-error-500)]">{error}</div>
      ) : cycles.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          No payroll cycles for {year}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Month</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[160px]">Locked At</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {MONTH_NAMES[c.month - 1]}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatPeriod(c.cycleStart, c.cycleEnd)}
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={STATUS_TONE[c.status]}>{c.status}</StatusPill>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {c.lockedAt
                      ? new Date(c.lockedAt).toLocaleString("en-GB", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {c.status === "OPEN" && (
                        <Button size="sm" variant="outline" onClick={() => setLockTarget(c)}>
                          <Lock className="mr-1 size-3.5" /> Lock
                        </Button>
                      )}
                      {(c.status === "LOCKED" || c.status === "EXPORTED") && (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadTimestamps(c.id)}>
                          <Download className="mr-1 size-3.5" /> Timestamps
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Lock confirmation dialog */}
      <Dialog open={!!lockTarget} onOpenChange={(o) => { if (!o) setLockTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lock Payroll Cycle</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Lock the <strong>{lockTarget ? MONTH_NAMES[lockTarget.month - 1] : ""} {year}</strong> cycle?
            This will freeze all attendance and leave records for the period. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockTarget(null)}>Cancel</Button>
            <Button disabled={locking} onClick={handleLock}>
              {locking ? "Locking..." : "Confirm Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
