"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  onExport: () => void;
}

export function SettingsHeader({ search, onSearchChange, onExport }: Props) {
  const t = useT();
  const dict = t.hr.settings;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-lg font-semibold">{dict.title}</h1>
        <p className="text-[12px] text-muted-foreground">{dict.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <SearchInput
          placeholder={dict.searchPlaceholder}
          value={search}
          onChange={onSearchChange}
          className="sm:max-w-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={onExport}>
          <Download className="mr-1.5 size-3.5" />
          {dict.exportJson}
        </Button>
      </div>
    </div>
  );
}
