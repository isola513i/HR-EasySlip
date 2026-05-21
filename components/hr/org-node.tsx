"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
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

interface NodeCardProps {
  node: OrgChartNode;
  isCollapsed: boolean;
  isHighlighted: boolean;
  onToggle: (id: string) => void;
}

const CONNECTOR_HEIGHT = 24;

function NodeCard({ node, isCollapsed, isHighlighted, onToggle }: NodeCardProps) {
  const hasChildren = node.children.length > 0;
  const fullName = `${node.firstNameTh} ${node.lastNameTh}`;
  const pictureSrc = node.hasProfilePicture
    ? profilePictureSrc(node.id, node.profilePictureUploadedAt)
    : null;
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "group relative flex w-[208px] flex-col items-center gap-2 rounded-2xl bg-card px-4 pb-3 pt-5 text-center transition-[box-shadow,transform,ring-color] duration-150",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)] ring-1 ring-(--border-subtle)",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06),0_12px_24px_rgba(15,23,42,0.08)]",
        isHighlighted && "ring-2 ring-(--es-accent-400) shadow-[0_0_0_4px_color-mix(in_oklch,var(--es-accent-500)_15%,transparent)]",
      )}
    >
      {pictureSrc ? (
        <div className="relative size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-card">
          <Image src={pictureSrc} alt={fullName} fill sizes="56px" className="object-cover" />
        </div>
      ) : (
        <div className="grid size-14 shrink-0 place-items-center rounded-full bg-(--es-accent-50) text-[15px] font-semibold tracking-wide text-(--es-accent-700) ring-2 ring-card">
          <span>{initials || "—"}</span>
        </div>
      )}
      <div className="min-w-0 space-y-0.5">
        <div className="truncate text-[13.5px] font-semibold leading-tight tracking-tight text-foreground">
          {fullName}
        </div>
        {node.positionName && (
          <div className="line-clamp-2 text-[11.5px] leading-tight text-muted-foreground">
            {node.positionName}
          </div>
        )}
        {node.departmentName && (
          <div className="flex items-center justify-center gap-1 pt-0.5 text-[10.5px] text-muted-foreground/70">
            <Building2 className="size-2.5" strokeWidth={2.5} />
            <span className="truncate">{node.departmentName}</span>
          </div>
        )}
        <div className="pt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {node.employeeCode}
        </div>
      </div>
    </div>
  );
}

interface Props {
  node: OrgChartNode;
  depth?: number;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  matchedIds?: Set<string>;
}

export function OrgNode({ node, depth = 0, collapsed, onToggle, matchedIds }: Props) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const showChildren = hasChildren && !isCollapsed;
  const isHighlighted = matchedIds ? matchedIds.has(node.id) : false;

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        node={node}
        isCollapsed={isCollapsed}
        isHighlighted={isHighlighted}
        onToggle={onToggle}
      />

      {showChildren && (
        <>
          <span
            aria-hidden="true"
            className="block w-px shrink-0 bg-(--es-neutral-200)"
            style={{ height: CONNECTOR_HEIGHT }}
          />
          <div className="relative flex items-start">
            {node.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === node.children.length - 1;
              const isOnly = node.children.length === 1;

              return (
                <div key={child.id} className="relative flex flex-col items-center px-4 pt-0">
                  {!isOnly && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 h-px bg-(--es-neutral-200)"
                      style={{
                        left: isFirst ? "50%" : 0,
                        right: isLast ? "50%" : 0,
                      }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="block w-px shrink-0 bg-(--es-neutral-200)"
                    style={{ height: CONNECTOR_HEIGHT }}
                  />
                  <OrgNode
                    node={child}
                    depth={depth + 1}
                    collapsed={collapsed}
                    onToggle={onToggle}
                    matchedIds={matchedIds}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
