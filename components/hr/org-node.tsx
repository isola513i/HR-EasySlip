"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import { profilePictureSrc } from "@/hooks/use-profile-picture";
import { cn } from "@/lib/utils";

export interface OrgChartNode {
  id: string;
  employeeCode: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string | null;
  lastNameEn: string | null;
  positionName: string | null;
  departmentName: string | null;
  managerId: string | null;
  hasProfilePicture: boolean;
  profilePictureUploadedAt: string | null;
  children: OrgChartNode[];
}

interface Props {
  node: OrgChartNode;
  depth: number;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
}

export function OrgNode({ node, depth, collapsed, onToggle }: Props) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const name = `${node.firstNameTh} ${node.lastNameTh}`;
  const pictureSrc = node.hasProfilePicture
    ? profilePictureSrc(node.id, node.profilePictureUploadedAt)
    : null;

  return (
    <div className={cn("py-1", depth > 0 && "border-l-2 border-[var(--es-neutral-100)] pl-3 ml-3")}>
      <div className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
        <button
          onClick={() => hasChildren && onToggle(node.id)}
          disabled={!hasChildren}
          className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted disabled:opacity-0"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {hasChildren && (isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />)}
        </button>
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
          {pictureSrc ? (
            <Image src={pictureSrc} alt={name} width={36} height={36} className="size-full object-cover" />
          ) : (
            <span>{name.slice(0, 1)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold">{name}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{node.employeeCode}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
            {node.positionName && <span>{node.positionName}</span>}
            {node.positionName && node.departmentName && <span>·</span>}
            {node.departmentName && <span>{node.departmentName}</span>}
          </div>
        </div>
        {hasChildren && (
          <span className="shrink-0 rounded-full bg-[var(--es-accent-50)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--es-accent-700)]">
            {node.children.length}
          </span>
        )}
      </div>
      {hasChildren && !isCollapsed && (
        <div>
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} depth={depth + 1} collapsed={collapsed} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
