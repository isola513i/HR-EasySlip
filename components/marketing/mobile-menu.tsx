"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  isAuthed: boolean
  labels: {
    menuTitle: string
    features: string
    useCases: string
    pricing: string
    faq: string
    about: string
    signIn: string
    startTrial: string
    goToDashboard: string
  }
}

export function MobileMenu({ isAuthed, labels }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const navLinks = [
    { href: "#features", label: labels.features },
    { href: "#use-cases", label: labels.useCases },
    { href: "#pricing", label: labels.pricing },
    { href: "#faq", label: labels.faq },
    { href: "#about", label: labels.about },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            aria-label="Open menu"
            className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
          >
            <Menu className="size-6" aria-hidden />
          </button>
        }
      />

      <SheetContent
        side="right"
        showCloseButton={false}
        overlayClassName="bg-black/40 supports-backdrop-filter:backdrop-blur-sm"
        className="!w-[88vw] !max-w-sm !gap-0 rounded-l-2xl overscroll-contain flex flex-col p-0"
      >
        {/* Drawer header */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border/50 px-5">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Image
              src="/favicons/android-chrome-192x192.png"
              alt=""
              width={34}
              height={34}
              className="rounded-xl"
            />
            <span className="text-base font-semibold text-foreground" translate="no">
              EasySlip HR
            </span>
          </Link>

          <SheetClose
            render={
              <button
                aria-label="Close menu"
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            }
          >
            <X className="size-5" aria-hidden />
          </SheetClose>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col overflow-y-auto px-3 pt-2 pb-1" aria-label="Page sections">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={close}
              className="flex min-h-[52px] items-center justify-between rounded-xl px-4 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary active:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <span>{label}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/40" aria-hidden />
            </a>
          ))}
        </nav>

        {/* CTA — pinned to bottom */}
        <div className="mt-auto border-t border-border/50 px-4 py-5 flex flex-col gap-2.5">
          {isAuthed ? (
            <Link
              href="/workspaces"
              onClick={close}
              className={cn(buttonVariants({ size: "lg" }), "w-full justify-center font-semibold")}
            >
              {labels.goToDashboard}
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full justify-center font-semibold border-[#3d46cc]",
                  "bg-gradient-to-r from-[#3d46cc] via-[#2f50e6] to-[#3b82f6]"
                )}
              >
                {labels.startTrial}
              </Link>
              <Link
                href="/signin"
                onClick={close}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full justify-center text-muted-foreground"
                )}
              >
                {labels.signIn}
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
