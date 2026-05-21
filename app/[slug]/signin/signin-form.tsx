"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormFieldError, FormRoot } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";

import { sendMagicLink, type SignInActionState } from "./actions";

interface Props {
  dict: Dictionary["signin"];
  /** Tenant slug — omit for global /signin flow (redirects to /workspaces) */
  slug?: string;
}

const REMEMBER_EMAIL_KEY = "easyslip:remember-email";

export function SignInForm({ dict, slug: slugProp }: Props) {
  const router = useRouter();
  const params = useParams<{ slug?: string }>();
  const slug = slugProp ?? params.slug ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Magic link state
  const [magicLinkState, setMagicLinkState] = useState<SignInActionState>({ status: "idle" });
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (stored) {
        setEmail(stored);
        setRememberEmail(true);
      }
    } catch {
      // ignore storage access errors (private mode, etc.)
    }
  }, []);

  const handleRememberEmailChange = (checked: boolean) => {
    setRememberEmail(checked);
    try {
      if (!checked) {
        window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
      } else if (email) {
        window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      }
    } catch {
      // ignore storage access errors
    }
  };

  const persistEmailIfRemembered = (value: string) => {
    if (!rememberEmail) return;
    try {
      if (value) {
        window.localStorage.setItem(REMEMBER_EMAIL_KEY, value);
      } else {
        window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      // ignore storage access errors
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? dict.invalidCredentials);
        return;
      }

      try {
        if (rememberEmail) {
          window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // ignore storage access errors
      }

      if (slug && data.data?.mustChangePassword) {
        router.push(`/${slug}/change-password`);
      } else {
        router.push("/workspaces");
      }
      router.refresh();
    } catch {
      setError(dict.errors.Default);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) return;
    setIsSendingMagicLink(true);
    const formData = new FormData();
    formData.set("email", email);
    const result = await sendMagicLink({ status: "idle" }, formData);

    if (result.status === "sent") {
      const checkEmailPath = slug
        ? `/${slug}/signin/check-email?email=${encodeURIComponent(email)}`
        : `/signin/check-email?email=${encodeURIComponent(email)}`;
      router.push(checkEmailPath);
      return;
    }

    setMagicLinkState(result);
    setIsSendingMagicLink(false);
  };

  return (
    <div className="space-y-5">
      {/* Password login form */}
      <FormRoot onSubmit={handlePasswordLogin} className="space-y-4">
        <FormField name="email">
          <Label htmlFor="email">{dict.emailLabel}</Label>
          <div className="relative">
            <Mail
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground"
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={dict.emailPlaceholder}
              disabled={isLoading}
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);
                persistEmailIfRemembered(value);
              }}
              className="h-12 pl-11 md:h-12"
            />
          </div>
          <FormFieldError inputType="email" />
        </FormField>
        <FormField name="password">
          <Label htmlFor="password">{dict.passwordLabel}</Label>
          <div className="relative">
            <KeyRound
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground"
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder={dict.passwordPlaceholder}
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-11 pr-11 md:h-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
              aria-label={showPassword ? dict.hidePassword : dict.showPassword}
              aria-pressed={showPassword}
              className={cn(
                "absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-muted-foreground",
                "hover:text-foreground transition-colors",
                "focus-visible:outline-none focus-visible:text-foreground",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <FormFieldError />
        </FormField>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-email"
              checked={rememberEmail}
              onCheckedChange={(checked) => handleRememberEmailChange(checked === true)}
              disabled={isLoading}
            />
            <Label
              htmlFor="remember-email"
              className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
            >
              {dict.rememberEmail}
            </Label>
          </div>
          <Link
            href={slug ? `/${slug}/signin/forgot-password` : "/signin/forgot-password"}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {dict.forgotPassword}
          </Link>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button
          type="submit"
          className="h-12 w-full text-base md:h-12"
          disabled={isLoading}
        >
          {isLoading ? dict.submitting : dict.submitButton}
        </Button>
      </FormRoot>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {dict.orMagicLink}
          </span>
        </div>
      </div>

      {/* Magic link button */}
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full text-base md:h-12"
        disabled={isSendingMagicLink || !email}
        onClick={handleMagicLink}
      >
        {isSendingMagicLink ? dict.sendingMagicLink : dict.sendMagicLink}
      </Button>
      {magicLinkState.status === "error" && magicLinkState.message && (
        <p className="text-destructive text-sm">{magicLinkState.message}</p>
      )}
    </div>
  );
}
