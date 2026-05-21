"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { platformSignIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

type State = { error: string } | { redirectUrl: string } | null;

interface Props {
  devEmail?: string;
  devPassword?: string;
}

export function PlatformSignInForm({ devEmail, devPassword }: Props) {
  const [state, action, pending] = useActionState(platformSignIn, null);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state && "redirectUrl" in state) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  function fillDevCredentials() {
    if (emailRef.current && devEmail) emailRef.current.value = devEmail;
    if (passwordRef.current && devPassword) passwordRef.current.value = devPassword;
  }

  return (
    <form action={action} className="space-y-5">
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
        <div className="relative">
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {state && "error" in state && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      {devEmail && devPassword && (
        <button
          type="button"
          onClick={fillDevCredentials}
          className="w-full py-1 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          [dev] fill credentials
        </button>
      )}
    </form>
  );
}
