import type { Metadata } from "next";
import { getDict } from "@/lib/i18n/get-dict";
import { PdpaScreen } from "@/components/hr/pdpa/pdpa-screen";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: t.hr.pdpa.pageTitle };
}

export default function PdpaPage() {
  return <PdpaScreen />;
}
