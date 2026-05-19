import type { Metadata } from "next"
import PricingTable from "@/components/marketing/pricing-table"
import FaqSection from "@/components/marketing/faq-section"
import CtaSection from "@/components/marketing/cta-section"

export const metadata: Metadata = {
  title: "Pricing — EasySlip HR",
}

export default function PricingPage() {
  return (
    <>
      <PricingTable />
      <FaqSection />
      <CtaSection />
    </>
  )
}
