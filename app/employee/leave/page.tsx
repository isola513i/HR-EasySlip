import type { Metadata } from "next";
import { LeaveScreen } from "@/components/employee/leave-screen";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.pageTitles.leave };
}

export default function LeavePage() {
  return <LeaveScreen />;
}
