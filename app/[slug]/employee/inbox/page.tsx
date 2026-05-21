import type { Metadata } from "next";
import { InboxScreen } from "@/components/employee/inbox-screen";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.common.inbox };
}

export default function InboxPage() {
  return <InboxScreen />;
}
