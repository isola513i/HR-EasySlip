import type { Metadata } from "next";
import { ReviewCyclesDashboard } from "@/components/hr/reviews/review-cycles-dashboard";

export const metadata: Metadata = { title: "Reviews — EasySlip HR" };

export default function ReviewsPage() {
  return <ReviewCyclesDashboard />;
}
