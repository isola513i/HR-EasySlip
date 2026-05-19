"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const SECTION_IDS = ["features", "use-cases", "pricing", "faq", "about"]

interface NavLink {
  href: string
  label: string
}

interface NavLinksProps {
  links: NavLink[]
  linkClassName: string
  activeLinkClassName?: string
}

export function NavLinks({ links, linkClassName, activeLinkClassName }: NavLinksProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const sections = SECTION_IDS
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length === 0) return
        const topmost = visible.reduce((prev, curr) =>
          curr.boundingClientRect.top < prev.boundingClientRect.top ? curr : prev
        )
        setActiveId(topmost.target.id)
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 }
    )

    sections.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {links.map(({ href, label }) => {
        const sectionId = href.startsWith("#") ? href.slice(1) : null
        const isActive = sectionId !== null && activeId === sectionId
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? true : undefined}
            className={cn(linkClassName, isActive && activeLinkClassName)}
          >
            {label}
          </Link>
        )
      })}
    </>
  )
}
