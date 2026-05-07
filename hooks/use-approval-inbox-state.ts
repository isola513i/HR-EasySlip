"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useApprovalInbox } from "@/hooks/use-approval-inbox";
import { formatLeaveType } from "@/lib/utils";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import { useT } from "@/lib/i18n/locale-context";
import type { ApprovalRow } from "@/types/manager";

export function useApprovalInboxState() {
  const t = useT();
  const { rows, isLoading, error, approve, reject, bulkDecision } = useApprovalInbox();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailRow, setDetailRow] = useState<ApprovalRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalRow | null>(null);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = `${r.employee.firstNameTh} ${r.employee.lastNameTh}`.toLowerCase();
      return (
        name.includes(q) ||
        r.employee.employeeCode.toLowerCase().includes(q) ||
        formatLeaveType(r.leaveType).toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((r) => selected.has(r.id));
  const visibleSelectedIds = useMemo(
    () => Array.from(selected).filter((id) => visibleRows.some((r) => r.id === id)),
    [selected, visibleRows],
  );

  const optimisticDismiss = useCallback((id: string) => {
    setExitingIds((prev) => new Set(prev).add(id));
  }, []);
  const cancelDismiss = useCallback((id: string) => {
    setExitingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = visibleRows.length > 0 && visibleRows.every((r) => next.has(r.id));
      if (allSelected) visibleRows.forEach((r) => next.delete(r.id));
      else visibleRows.forEach((r) => next.add(r.id));
      return next;
    });
  }, [visibleRows]);

  const handleApprove = useCallback(async (id: string) => {
    hapticTap();
    optimisticDismiss(id);
    try {
      await approve(id);
      hapticSuccess();
      toast.success(t.manager.approved);
      setSelected(new Set());
    } catch {
      hapticError();
      toast.error(t.manager.approveFailed);
    } finally {
      cancelDismiss(id);
    }
  }, [approve, optimisticDismiss, cancelDismiss, t.manager.approved, t.manager.approveFailed]);

  const handleReject = useCallback(async (reason: string) => {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    hapticTap();
    optimisticDismiss(id);
    try {
      await reject(id, reason);
      hapticSuccess();
      toast.success(t.manager.rejected);
      setSelected(new Set());
    } catch {
      hapticError();
      toast.error(t.manager.rejectFailed);
    } finally {
      cancelDismiss(id);
    }
  }, [rejectTarget, reject, optimisticDismiss, cancelDismiss, t.manager.rejected, t.manager.rejectFailed]);

  const reportBulk = useCallback((ok: number, fail: number, successKey: "bulkApproved" | "bulkRejected") => {
    if (fail === 0) toast.success(t.manager[successKey].replace("{ok}", String(ok)));
    else if (ok === 0) toast.error(t.manager.bulkFailed.replace("{fail}", String(fail)));
    else toast.warning(t.manager.bulkMixed.replace("{ok}", String(ok)).replace("{fail}", String(fail)));
  }, [t.manager]);

  const handleBulkApprove = useCallback(async () => {
    try {
      const results = await bulkDecision(visibleSelectedIds, "APPROVED");
      const ok = results.filter((r) => r.ok).length;
      reportBulk(ok, results.length - ok, "bulkApproved");
      setSelected(new Set());
    } catch { toast.error(t.manager.actionFailed); }
  }, [visibleSelectedIds, bulkDecision, reportBulk, t.manager.actionFailed]);

  const handleBulkReject = useCallback(async (reason: string) => {
    try {
      const results = await bulkDecision(visibleSelectedIds, "REJECTED", reason);
      const ok = results.filter((r) => r.ok).length;
      reportBulk(ok, results.length - ok, "bulkRejected");
      setSelected(new Set());
      setBulkRejectOpen(false);
    } catch { toast.error(t.manager.actionFailed); }
  }, [visibleSelectedIds, bulkDecision, reportBulk, t.manager.actionFailed]);

  return {
    rows, isLoading, error,
    query, setQuery,
    visibleRows, allVisibleSelected, visibleSelectedIds,
    selected, setSelected,
    detailRow, setDetailRow,
    rejectTarget, setRejectTarget,
    bulkRejectOpen, setBulkRejectOpen,
    exitingIds,
    toggle, toggleAll,
    handleApprove, handleReject,
    handleBulkApprove, handleBulkReject,
  };
}
