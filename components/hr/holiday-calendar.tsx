"use client";

import { useMemo, useState } from "react";
import { Plus, Calendar as CalendarIcon, Building, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHolidays, type Holiday } from "@/hooks/use-holidays";
import { useT } from "@/lib/i18n/locale-context";
import { HolidayYearCalendar } from "@/components/hr/holidays/holiday-year-calendar";
import { HolidayStatCard } from "@/components/hr/holidays/holiday-stat-card";
import { HolidayList } from "@/components/hr/holidays/holiday-list";
import { HolidayDialog, type HolidayDialogPayload } from "@/components/hr/holidays/holiday-dialog";

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

export function HolidayCalendar() {
  const t = useT();
  const {
    holidays,
    isLoading,
    error: fetchError,
    year,
    setYear,
    create,
    update,
    remove,
  } = useHolidays(currentYear);

  const [editing, setEditing] = useState<Holiday | null>(null);
  const [presetDate, setPresetDate] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const openNew = (preset?: string) => {
    setEditing(null);
    setPresetDate(preset);
    setDialogOpen(true);
  };

  const openEdit = (h: Holiday) => {
    setEditing(h);
    setPresetDate(undefined);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setPresetDate(undefined);
  };

  const handleSubmit = async (payload: HolidayDialogPayload) => {
    try {
      if (editing) {
        await update(editing.id, payload);
        toast.success(t.hr.holidayUpdated);
      } else {
        await create(payload);
        toast.success(t.hr.holidayAdded);
      }
    } catch {
      toast.error(t.common.saveFailed);
      throw new Error("save_failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success(t.hr.holidayDeleted);
    } catch {
      toast.error(t.common.deleteFailed);
    }
  };

  const stats = useMemo(() => {
    let gov = 0;
    let company = 0;
    for (const h of holidays) {
      if (h.isSubstituted) company++;
      else gov++;
    }
    return { total: holidays.length, gov, company };
  }, [holidays]);

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => a.date.localeCompare(b.date)),
    [holidays],
  );

  const handleCalendarSelect = (iso: string) => {
    const match = holidays.find((h) => h.date.slice(0, 10) === iso);
    if (match) openEdit(match);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{t.hr.holidaysPageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t.hr.holidaysPageSubtitle}</p>
        </div>
        <Button size="sm" onClick={() => openNew()} className="gap-1.5">
          <Plus className="size-4" /> {t.hr.addHoliday}
        </Button>
      </div>

      <Tabs value={String(year)} onValueChange={(v) => setYear(Number(v))}>
        <TabsList>
          {YEARS.map((y) => (
            <TabsTrigger key={y} value={String(y)} className="min-w-[5rem] tabular-nums">
              {y}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <HolidayStatCard icon={CalendarIcon} label={t.hr.holidaysStatTotal} value={stats.total} tone="accent" />
        <HolidayStatCard icon={Building} label={t.hr.holidaysStatGov} value={stats.gov} tone="neutral" />
        <HolidayStatCard icon={Briefcase} label={t.hr.holidaysStatCompany} value={stats.company} tone="muted" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-card p-5 ring-1 ring-(--border-subtle) shadow-(--es-shadow-xs)">
          <h2 className="mb-4 text-[15px] font-semibold tracking-tight">
            {t.hr.holidaysCalendarTitle.replace("{year}", String(year))}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <HolidayYearCalendar year={year} holidays={holidays} onSelectDate={handleCalendarSelect} />
          )}
        </section>

        <HolidayList
          holidays={sortedHolidays}
          total={stats.total}
          year={year}
          isLoading={isLoading}
          error={fetchError}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      <HolidayDialog
        open={dialogOpen}
        editing={editing}
        presetDate={presetDate}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
