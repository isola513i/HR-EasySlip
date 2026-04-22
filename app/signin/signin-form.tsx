"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/dictionaries";

import {
  sendMagicLink,
  type SignInActionState,
} from "./actions";

const initialState: SignInActionState = { status: "idle" };

interface Props {
  dict: Dictionary["signin"];
}

export function SignInForm({ dict }: Props) {
  const [state, formAction, isPending] = useActionState(
    sendMagicLink,
    initialState,
  );

  if (state.status === "sent") {
    return (
      <div className="space-y-3 text-sm">
        <p>
          {dict.magicLinkSent} <strong>{state.email}</strong>
        </p>
        <Link
          href="/signin/check-email"
          className="text-primary underline underline-offset-4"
        >
          {dict.moreDetails}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{dict.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={dict.emailPlaceholder}
          disabled={isPending}
        />
        {state.status === "error" && state.message ? (
          <p className="text-destructive text-sm">{state.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? dict.submitting : dict.submitButton}
      </Button>
    </form>
  );
}
