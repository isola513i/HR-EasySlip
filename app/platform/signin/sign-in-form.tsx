"use client";

import { useActionState, useEffect, useRef } from "react";
import { platformSignIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = { error: string } | { redirectUrl: string } | null;

interface Props {
  devEmail?: string;
  devPassword?: string;
}

export function PlatformSignInForm({ devEmail, devPassword }: Props) {
  const [state, action, pending] = useActionState(platformSignIn, null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state && "redirectUrl" in state) {
      setTimeout(() => { window.location.href = state.redirectUrl; }, 0);
    }
  }, [state]);

  function fillDevCredentials() {
    if (emailRef.current && devEmail) emailRef.current.value = devEmail;
    if (passwordRef.current && devPassword) passwordRef.current.value = devPassword;
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="admin@easyslip.app"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state && "error" in state && (
        <p className="text-sm text-rose-400">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {devEmail && devPassword && (
        <button
          type="button"
          onClick={fillDevCredentials}
          className="w-full text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
        >
          [dev] fill credentials
        </button>
      )}
    </form>
  );
}
