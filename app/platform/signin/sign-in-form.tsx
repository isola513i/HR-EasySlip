"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { platformSignIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormRoot, FormField, FormFieldError } from "@/components/ui/form-field";
import { Eye, EyeOff } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type State = { error: string } | { redirectUrl: string } | null;

interface Props {
  t: Dictionary["platform"]["signin"];
  devEmail?: string;
  devPassword?: string;
}

export function PlatformSignInForm({ t, devEmail, devPassword }: Props) {
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
    <FormRoot action={action} className="space-y-5">
      <FormField name="email">
        <Label htmlFor="email">{t.emailLabel}</Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder={t.emailPlaceholder}
        />
        <FormFieldError inputType="email" />
      </FormField>

      <FormField name="password">
        <Label htmlFor="password">{t.passwordLabel}</Label>
        <div className="relative">
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder={t.passwordPlaceholder}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? t.hidePassword : t.showPassword}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <FormFieldError />
      </FormField>

      {state && "error" in state && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t.signingIn : t.signInButton}
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
    </FormRoot>
  );
}
