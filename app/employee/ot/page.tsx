import type { Metadata } from "next";
import { OTRequestForm } from "@/components/employee/ot-request-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.pageTitles.ot };
}

export default function OTPage() {
  return <OTRequestForm />;
}
