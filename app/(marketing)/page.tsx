import type { Metadata } from "next"
import { HeroSection } from "@/components/marketing/hero-section"
import TrustPillars from "@/components/marketing/trust-pillars"
import ProblemSolution from "@/components/marketing/problem-solution"
import ProductPreview from "@/components/marketing/product-preview"
import FeatureGrid from "@/components/marketing/feature-grid"
import UseCases from "@/components/marketing/use-cases"
import PricingTable from "@/components/marketing/pricing-table"
import FaqSection from "@/components/marketing/faq-section"
import AboutSection from "@/components/marketing/about-section"
import CtaSection from "@/components/marketing/cta-section"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getLocale } from "@/lib/i18n/get-locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = getDictionary(locale)
  return {
    title: "EasySlip HR — HR สำหรับทีมไทย",
    description: t.metadata.description,
    openGraph: {
      title: "EasySlip HR",
      description: t.metadata.description,
      type: "website",
    },
  }
}

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <TrustPillars />
      <ProblemSolution />
      <ProductPreview />
      <FeatureGrid />
      <UseCases />
      <PricingTable />
      <FaqSection />
      <AboutSection />
      <CtaSection />
    </>
  )
}
