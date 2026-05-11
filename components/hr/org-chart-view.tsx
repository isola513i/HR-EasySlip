"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, ZoomIn, ZoomOut, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import { OrgNode, type OrgChartNode } from "@/components/hr/org-node";
import { apiFetch } from "@/lib/api/client";
import { useT } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

function flattenNodes(nodes: OrgChartNode[]): OrgChartNode[] {
  const out: OrgChartNode[] = [];
  const walk = (n: OrgChartNode) => {
    out.push(n);
    n.children.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

function matchesQuery(node: OrgChartNode, q: string): boolean {
  if (!q) return false;
  const haystack = [
    node.firstNameTh,
    node.lastNameTh,
    node.firstNameEn,
    node.lastNameEn,
    node.employeeCode,
    node.positionName,
    node.departmentName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

interface SearchResult {
  /** IDs of nodes whose own fields match the query (used for the count chip + highlight). */
  direct: Set<string>;
  /** Direct hits plus every ancestor on the path — used to keep matched nodes visible. */
  visible: Set<string>;
}

/**
 * Walk the tree once and produce both the direct-match set and the
 * ancestor-augmented visible set. Splitting them lets the count chip
 * report only real hits while the auto-expand logic still surfaces
 * matched nodes inside collapsed branches.
 */
function searchTree(nodes: OrgChartNode[], q: string): SearchResult {
  const direct = new Set<string>();
  const visible = new Set<string>();
  if (!q) return { direct, visible };
  const walk = (n: OrgChartNode, ancestors: string[]): boolean => {
    const ownHit = matchesQuery(n, q);
    if (ownHit) direct.add(n.id);
    let descendantHit = false;
    for (const c of n.children) {
      if (walk(c, [...ancestors, n.id])) descendantHit = true;
    }
    const inPath = ownHit || descendantHit;
    if (inPath) {
      visible.add(n.id);
      ancestors.forEach((id) => visible.add(id));
    }
    return inPath;
  };
  nodes.forEach((n) => walk(n, []));
  return { direct, visible };
}

const ZOOM_LEVELS = [0.5, 0.6, 0.75, 0.85, 1, 1.15, 1.3, 1.5] as const;

export function OrgChartView() {
  const t = useT();
  const [tree, setTree] = useState<OrgChartNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [zoomIdx, setZoomIdx] = useState(4); // index of 1.0

  useEffect(() => {
    apiFetch<OrgChartNode[]>("/api/v1/hr/org-chart")
      .then(setTree)
      .catch((e) => setError(e instanceof Error ? e.message : "load failed"));
  }, []);

  const search = useMemo(
    () => (tree ? searchTree(tree, query) : { direct: new Set<string>(), visible: new Set<string>() }),
    [tree, query],
  );

  // When searching, auto-expand any collapsed branches that contain a match
  // so the user actually sees the highlighted node.
  const effectiveCollapsed = useMemo(() => {
    if (!query || search.visible.size === 0) return collapsed;
    const next = new Set(collapsed);
    for (const id of search.visible) next.delete(id);
    return next;
  }, [collapsed, search.visible, query]);

  const totalCount = tree ? flattenNodes(tree).length : 0;
  const matchCount = query ? search.direct.size : totalCount;
  const isZeroMatch = !!query && search.direct.size === 0;

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => {
    if (!tree) return;
    const allWithChildren = flattenNodes(tree)
      .filter((n) => n.children.length > 0)
      .map((n) => n.id);
    setCollapsed(new Set(allWithChildren));
  };

  const zoom = ZOOM_LEVELS[zoomIdx];
  const zoomIn = () => setZoomIdx((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  const zoomOut = () => setZoomIdx((i) => Math.max(0, i - 1));
  const resetZoom = () => setZoomIdx(4);

  if (tree === null && !error) {
    return (
      <div className="space-y-3 p-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="py-20 text-center text-sm text-destructive">{error}</div>;
  }

  if (!tree) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.orgChart.pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.orgChart.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-card p-1 ring-1 ring-[var(--border-subtle)] shadow-[var(--es-shadow-xs)]">
          <Button variant="ghost" size="icon-sm" onClick={zoomOut} disabled={zoomIdx === 0} aria-label={t.hr.orgChart.zoomOut}>
            <ZoomOut />
          </Button>
          <button
            type="button"
            onClick={resetZoom}
            aria-label={t.hr.orgChart.resetZoom}
            className="min-w-[3.5rem] rounded-md px-2 py-1 text-center text-[11.5px] font-semibold tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {Math.round(zoom * 100)}%
          </button>
          <Button variant="ghost" size="icon-sm" onClick={zoomIn} disabled={zoomIdx === ZOOM_LEVELS.length - 1} aria-label={t.hr.orgChart.zoomIn}>
            <ZoomIn />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[240px] flex-1">
          <SearchInput
            placeholder={t.hr.orgChart.searchPlaceholder}
            value={query}
            onChange={setQuery}
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-muted/40 px-3 py-1.5 text-[12px] font-medium tabular-nums text-muted-foreground">
          <Users className="size-3.5" />
          <span>
            <span className="font-semibold text-foreground">{matchCount}</span>
            <span className="text-muted-foreground/70"> / {totalCount}</span>
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={expandAll} className="gap-1.5">
          <ChevronsUpDown className="size-3.5" /> {t.hr.orgChart.expandAll}
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll} className="gap-1.5">
          <ChevronsDownUp className="size-3.5" /> {t.hr.orgChart.collapseAll}
        </Button>
      </div>

      {tree.length === 0 || isZeroMatch ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <Users className="size-10 opacity-40" />
          <p className="text-sm font-medium text-foreground">
            {isZeroMatch ? t.hr.orgChart.noMatchesFmt.replace("{query}", query) : t.common.noResults}
          </p>
          {isZeroMatch && (
            <p className="text-[12px] text-muted-foreground">{t.hr.orgChart.noMatchesHint}</p>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "relative overflow-auto rounded-2xl bg-[radial-gradient(circle_at_1px_1px,var(--es-neutral-200)_1px,transparent_0)] [background-size:24px_24px] bg-card/40 ring-1 ring-[var(--border-subtle)]",
            "min-h-[420px] [scrollbar-width:thin]",
          )}
        >
          <div
            className="flex w-fit min-w-full items-start justify-center gap-12 p-10 transition-transform duration-200 ease-[var(--es-ease-out)]"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            {tree.map((root) => (
              <OrgNode
                key={root.id}
                node={root}
                depth={0}
                collapsed={effectiveCollapsed}
                onToggle={toggle}
                matchedIds={query ? search.direct : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
