import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ReviewsScreen } from "@/components/employee/reviews/reviews-screen";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return { title: t.reviews.title };
}

export default function EmployeeReviewsPage() {
  return <ReviewsScreen />;
}
