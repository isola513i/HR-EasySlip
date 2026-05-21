"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Dictionary } from "@/lib/i18n/dictionaries"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useFieldErrors } from "@/lib/hooks/use-field-errors"
import { RESERVED_SLUGS, SLUG_RE, PHONE_RE } from "@/lib/validation/trial-signup"

type SignupDict = Dictionary["marketing"]["signup"]

interface SignupFormProps {
  dict: SignupDict
  rootDomain?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SignupField = "companyName" | "slug" | "contactName" | "phone" | "email" | "teamSize"

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid"

function toSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const SLUG_STATUS_STYLE: Record<SlugStatus, { color: string; text: (d: SignupDict) => string | null }> = {
  idle:      { color: "text-muted-foreground", text: () => null },
  checking:  { color: "text-muted-foreground", text: (d) => d.slugChecking },
  available: { color: "text-green-600",        text: (d) => d.slugAvailable },
  taken:     { color: "text-destructive",      text: (d) => d.slugTaken },
  invalid:   { color: "text-destructive",      text: (d) => d.slugInvalid },
}

export function SignupForm({ dict: d, rootDomain }: SignupFormProps) {
  const router = useRouter()

  const [companyName, setCompanyName] = useState("")
  const [slug, setSlug] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [teamSize, setTeamSize] = useState("")
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle")
  const { errors, clearField, setFieldErrors } = useFieldErrors<SignupField>()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!slug) { setSlugStatus("idle"); return }
    if (!SLUG_RE.test(slug)) { setSlugStatus("invalid"); return }
    if (RESERVED_SLUGS.has(slug)) { setSlugStatus("taken"); return }

    setSlugStatus("checking")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/marketing/check-slug?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        setSlugStatus(data.available ? "available" : "taken")
      } catch {
        setSlugStatus("idle")
      }
    }, 800)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [slug])

  function validate(): boolean {
    const e: Partial<Record<SignupField, string>> = {}

    if (companyName.trim().length < 2)
      e.companyName = d.errorCompanyRequired

    if (!slug)
      e.slug = d.errorSlugRequired
    else if (slugStatus === "invalid")
      e.slug = d.slugInvalid
    else if (slugStatus === "taken")
      e.slug = d.errorSlugTaken
    else if (slugStatus === "checking")
      e.slug = d.slugChecking

    if (!contactName.trim() || contactName.trim().length < 2)
      e.contactName = d.errorContactRequired

    if (!email.trim())
      e.email = d.errorEmailRequired
    else if (!EMAIL_RE.test(email))
      e.email = d.errorEmailInvalid

    const normalizedPhone = phone.replace(/[\s()-]/g, "")
    if (normalizedPhone && !PHONE_RE.test(normalizedPhone))
      e.phone = d.errorPhoneInvalid

    if (!teamSize)
      e.teamSize = d.errorTeamSizeRequired

    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/marketing/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, desiredSlug: slug, contactName, email, phone, teamSize }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data?.code === "SLUG_TAKEN" ? d.errorSlugTaken : d.errorGeneric
        setSubmitError(msg)
        return
      }
      router.push(`/signup/thanks?email=${encodeURIComponent(email)}`)
    } catch {
      setSubmitError(d.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  const { color: slugHintColor, text: getSlugHintText } = SLUG_STATUS_STYLE[slugStatus]
  const slugHintText = getSlugHintText(d)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Field id="companyName" label={d.companyName} error={errors.companyName}>
          <Input
            id="companyName"
            autoComplete="organization"
            placeholder={d.companyNamePlaceholder}
            value={companyName}
            onChange={(e) => { setCompanyName(e.target.value); clearField("companyName") }}
            className={errors.companyName ? "border-destructive" : ""}
          />
        </Field>

        <Field id="slug" label={d.slug} error={errors.slug}>
          <Input
            id="slug"
            autoComplete="off"
            placeholder={d.slugPlaceholder}
            className={cn("font-mono", errors.slug ? "border-destructive" : "")}
            value={slug}
            onChange={(e) => { setSlug(toSlug(e.target.value)); clearField("slug") }}
          />
          <p className="text-xs text-muted-foreground">
            {d.slugHint}{" "}
            <span className="font-mono font-medium">
              {slug ? `/${slug}/dashboard` : `/your-team/dashboard`}
            </span>
          </p>
          {!errors.slug && slugHintText && (
            <p className={cn("text-xs font-medium", slugHintColor)}>{slugHintText}</p>
          )}
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Field id="contactName" label={d.contactName} error={errors.contactName}>
          <Input
            id="contactName"
            autoComplete="name"
            placeholder={d.contactNamePlaceholder}
            value={contactName}
            onChange={(e) => { setContactName(e.target.value); clearField("contactName") }}
            className={errors.contactName ? "border-destructive" : ""}
          />
        </Field>

        <Field id="phone" label={d.phone} error={errors.phone}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder={d.phonePlaceholder}
            value={phone}
            onChange={(e) => { setPhone(e.target.value); clearField("phone") }}
            className={errors.phone ? "border-destructive" : ""}
          />
        </Field>
      </div>

      <Field id="email" label={d.email} error={errors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={d.emailPlaceholder}
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearField("email") }}
          className={errors.email ? "border-destructive" : ""}
        />
      </Field>

      <Field id="teamSize" label={d.teamSize} error={errors.teamSize}>
        <Select
          value={teamSize}
          onValueChange={(v) => { setTeamSize(v ?? ""); clearField("teamSize") }}
        >
          <SelectTrigger id="teamSize" className={cn("w-full", errors.teamSize ? "border-destructive" : "")}>
            <SelectValue placeholder={d.teamSizePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="size1">{d.size1}</SelectItem>
            <SelectItem value="size2">{d.size2}</SelectItem>
            <SelectItem value="size3">{d.size3}</SelectItem>
            <SelectItem value="size4">{d.size4}</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {submitError && (
        <p className="text-sm text-destructive">{submitError}</p>
      )}

      <p className="text-xs text-muted-foreground">
        {d.terms}{" "}
        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{d.termsLink}</Link>
        {" "}{d.and}{" "}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{d.privacyLink}</Link>.
      </p>

      <Button
        type="submit"
        className={cn(
          "w-full font-semibold shadow-lg shadow-primary/25",
          "bg-gradient-to-r from-[#3d46cc] via-[#2f50e6] to-[#3b82f6] bg-clip-border border-[#3d46cc]",
          "hover:from-[#2a36d4] hover:via-[#2745d9] hover:to-[#2563eb]",
          "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 transition-all duration-200 ease-out"
        )}
        disabled={submitting || slugStatus === "checking"}
      >
        {submitting ? d.submitting : d.submit}
      </Button>
    </form>
  )
}
