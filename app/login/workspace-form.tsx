"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import type { Dictionary } from "@/lib/i18n/dictionaries"

const SLUG_RE = /^[a-z0-9-]{1,63}$/

type LoginDict = Dictionary["marketing"]["login"]

function toSlug(v: string) {
  return v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export function WorkspaceForm({ dict: d, rootDomain }: { dict: LoginDict; rootDomain: string }) {
  const [slug, setSlug] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slug.trim()) {
      setError(d.slugRequired)
      return
    }
    if (!SLUG_RE.test(slug)) {
      setError(d.invalidSlug)
      return
    }
    const proto = window.location.protocol
    window.location.href = `${proto}//${slug}.${rootDomain}/signin`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="slug">{d.slugLabel}</Label>
        <div className="flex items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden">
          <Input
            id="slug"
            autoFocus
            value={slug}
            onChange={(e) => { setSlug(toSlug(e.target.value)); setError(null) }}
            placeholder={d.slugPlaceholder}
            autoComplete="off"
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
          />
          <span className="pr-3 text-sm text-muted-foreground whitespace-nowrap font-mono select-none">
            .{rootDomain}
          </span>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {slug && !error && (
          <p className="text-xs text-muted-foreground">
            {d.slugHint}{" "}
            <span className="font-mono font-medium text-foreground">{slug}.{rootDomain}</span>
          </p>
        )}
      </div>

      <Button type="submit" className="w-full font-semibold bg-linear-to-r from-[#3d46cc] via-[#2f50e6] to-[#3b82f6]">
        {d.continue}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {d.noAccount}{" "}
        <Link href="/signup" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
          {d.startTrial}
        </Link>
      </p>
    </form>
  )
}
