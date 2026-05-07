"use client";

import { LeaveTypeCard } from "@/components/employee/leave/leave-type-card";

export type LeaveTypeKey =
  | "SICK"
  | "PERSONAL"
  | "ANNUAL"
  | "LEAVE_WITHOUT_PAY"
  | "MATERNITY"
  | "PATERNITY"
  | "CHILD_CARE"
  | "ORDINATION"
  | "MILITARY"
  | "FUNERAL"
  | "TRAINING";

interface LeaveTypeOption {
  key: LeaveTypeKey;
  label: string;
}

interface LeaveTypeGridProps {
  options: LeaveTypeOption[];
  selected: LeaveTypeKey;
  onSelect: (key: LeaveTypeKey) => void;
  getBalanceText: (key: LeaveTypeKey) => string;
  isIneligible: (key: LeaveTypeKey) => boolean;
}

export function LeaveTypeGrid({
  options,
  selected,
  onSelect,
  getBalanceText,
  isIneligible,
}: LeaveTypeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => (
        <LeaveTypeCard
          key={opt.key}
          label={opt.label}
          balanceText={getBalanceText(opt.key)}
          selected={selected === opt.key}
          disabled={isIneligible(opt.key)}
          onSelect={() => onSelect(opt.key)}
        />
      ))}
    </div>
  );
}
