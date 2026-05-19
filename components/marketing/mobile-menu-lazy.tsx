"use client"

import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import type { ComponentProps } from "react"
import type { MobileMenu } from "./mobile-menu"

type Props = ComponentProps<typeof MobileMenu>

// Defers mounting the Sheet (base-ui) until after hydration so the server and
// client initial trees are identical — prevents dynamic-ID hydration mismatch
// and the cascading ID shift that would affect Tabs/Accordion further down.
export function MobileMenuLazy(props: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <button
        aria-label="Open menu"
        disabled
        className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
      >
        <Menu className="size-6" aria-hidden />
      </button>
    )
  }

  // Loaded lazily to keep it out of the initial bundle
  const { MobileMenu } = require("./mobile-menu") as typeof import("./mobile-menu")
  return <MobileMenu {...props} />
}
