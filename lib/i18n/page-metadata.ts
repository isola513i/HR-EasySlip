import type { Metadata } from "next";
import { getLocale } from "./get-locale";
import { getDictionary, type Dictionary } from "./dictionaries";

export type PageTitleKey = keyof Dictionary["metadata"]["pageTitles"];

export async function pageMetadata(key: PageTitleKey): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.metadata.pageTitles[key] };
}
