import type { Metadata } from "next";
import { ClockScreen } from "@/components/employee/clock-screen";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.pageTitles.clock };
}

export default function ClockPage() {
  return <ClockScreen />;
}
