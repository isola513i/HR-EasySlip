"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/shared/search-input";
import { StatusPill } from "@/components/shared/status-pill";
import { OrgNode, type OrgChartNode } from "@/components/hr/org-node";
import { apiFetch } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";

function flattenIds(nodes: OrgChartNode[]): string[] {
  const ids: string[] = [];
  const walk = (n: OrgChartNode) => { ids.push(n.id); n.children.forEach(walk); };
  nodes.forEach(walk);
  return ids;
}

function flattenNodes(nodes: OrgChartNode[]): OrgChartNode[] {
  const out: OrgChartNode[] = [];
  const walk = (n: OrgChartNode) => { out.push(n); n.children.forEach(walk); };
  nodes.forEach(walk);
  return out;
}

function matches(node: OrgChartNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    node.firstNameTh, node.lastNameTh,
    node.firstNameEn, node.lastNameEn,
    node.employeeCode, node.positionName, node.departmentName,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

function pruneToMatches(nodes: OrgChartNode[], query: string): OrgChartNode[] {
  if (!query) return nodes;
  return nodes
    .map((n) => {
      const filteredChildren = pruneToMatches(n.children, query);
      if (matches(n, query) || filteredChildren.length > 0) {
        return { ...n, children: filteredChildren };
      }
      return null;
    })
    .filter((n): n is OrgChartNode => n !== null);
}

export function OrgChartView() {
  const t = useT();
  const [tree, setTree] = useState<OrgChartNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiFetch<OrgChartNode[]>("/api/v1/hr/org-chart")
      .then(setTree)
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"));
  }, []);

  const visible = useMemo(() => (tree ? pruneToMatches(tree, query) : []), [tree, query]);
  const totalCount = tree ? flattenIds(tree).length : 0;
  const visibleCount = flattenIds(visible).length;

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => {
    if (!tree) return;
    const allWithChildren = flattenNodes(tree).filter((n) => n.children.length > 0).map((n) => n.id);
    setCollapsed(new Set(allWithChildren));
  };

  if (tree === null && !error) {
    return (
      <div className="space-y-3 p-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (error) {
    return <div className="py-20 text-center text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">{t.hr.orgChart.pageTitle}</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.orgChart.pageSubtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder={t.hr.orgChart.searchPlaceholder} value={query} onChange={setQuery} />
        <StatusPill tone="neutral" dot={false}>{`${t.common.all} (${visibleCount}/${totalCount})`}</StatusPill>
        <button onClick={expandAll} className="text-[12px] font-medium text-[var(--es-accent-600)] hover:underline">{t.hr.orgChart.expandAll}</button>
        <span className="text-muted-foreground">·</span>
        <button onClick={collapseAll} className="text-[12px] font-medium text-[var(--es-accent-600)] hover:underline">{t.hr.orgChart.collapseAll}</button>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Users className="size-10 opacity-40" />
          <p className="text-sm">{t.common.noResults}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-3 shadow-[var(--es-shadow-sm)]">
          {visible.map((root) => (
            <OrgNode key={root.id} node={root} depth={0} collapsed={collapsed} onToggle={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
