import type { Metadata } from "next";
import { ReviewFormScreen } from "@/components/employee/reviews/review-form-screen";

export const metadata: Metadata = { title: "Review — EasySlip" };

export default async function EmployeeReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReviewFormScreen reviewId={id} />;
}
