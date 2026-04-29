"use client";

import { useEffect, useState } from "react";
import { ListIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface TocSection {
  id: string;
  title: string;
}

interface Props {
  sections: TocSection[];
  label: string;
}

export function TocSidebar({ sections, label }: Props) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (sections.length === 0) return;
    const lastId = sections[sections.length - 1].id;

    const update = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const viewportH = window.innerHeight;

      // Near the bottom: force-activate the last section. This handles the
      // case where the page can't scroll far enough to push the final
      // heading past a fixed threshold line.
      if (scrollY + viewportH >= docHeight - 24) {
        setActiveId(lastId);
        return;
      }

      const threshold = scrollY + viewportH * 0.3;
      let current = sections[0].id;
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + scrollY;
        if (top <= threshold) current = id;
        else break;
      }
      setActiveId(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    scrollTo(id);
    setSheetOpen(false);
  };

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block">
        <nav className="sticky top-24">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-foreground/65">
            {label}
          </p>
          <ul className="space-y-1 border-l">
            {sections.map(({ id, title }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => handleClick(e, id)}
                  className={cn(
                    "-ml-px block border-l py-1.5 pl-4 text-sm leading-relaxed transition-colors",
                    activeId === id
                      ? "border-primary font-medium text-foreground"
                      : "border-transparent text-foreground/65 hover:text-foreground",
                  )}
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile floating TOC button + bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              aria-label={label}
              className="fixed bottom-6 right-6 z-40 grid size-14 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-black/10 transition-transform hover:scale-105 lg:hidden"
            />
          }
        >
          <ListIcon className="size-5" />
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[70dvh]">
          <SheetHeader>
            <SheetTitle>{label}</SheetTitle>
          </SheetHeader>
          <ul className="space-y-1 overflow-y-auto px-4 pb-6">
            {sections.map(({ id, title }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => handleClick(e, id)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm leading-relaxed transition-colors",
                    activeId === id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground/80 hover:bg-muted",
                  )}
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
