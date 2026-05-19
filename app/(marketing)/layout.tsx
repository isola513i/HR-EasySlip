import type { Metadata } from "next"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import MarketingFooter from "@/components/marketing/marketing-footer"

export const metadata: Metadata = {
  title: "EasySlip HR — HR สำหรับทีมไทย",
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNav />
      <main id="main-content" className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
