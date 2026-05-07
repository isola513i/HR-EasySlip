import type { Metadata } from "next";
import { ReviewsScreen } from "@/components/employee/reviews/reviews-screen";

export const metadata: Metadata = { title: "My Reviews — EasySlip" };

export default function EmployeeReviewsPage() {
  return <ReviewsScreen />;
}
