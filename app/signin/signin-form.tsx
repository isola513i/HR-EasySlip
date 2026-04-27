"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/dictionaries";

import { sendMagicLink, type SignInActionState } from "./actions";

interface Props {
  dict: Dictionary["signin"];
}

export function SignInForm({ dict }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Magic link state
  const [magicLinkState, setMagicLinkState] = useState<SignInActionState>({ status: "idle" });
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

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

      if (data.data?.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push("/");
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
    setMagicLinkState(result);
    setIsSendingMagicLink(false);
  };

  if (magicLinkState.status === "sent") {
    return (
      <div className="space-y-3 text-sm">
        <p>
          {dict.magicLinkSent} <strong>{magicLinkState.email}</strong>
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
    <div className="space-y-5">
      {/* Password login form */}
      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{dict.emailLabel}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={dict.emailPlaceholder}
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{dict.passwordLabel}</Label>
            <Link
              href="/signin/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {dict.forgotPassword}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder={dict.passwordPlaceholder}
            disabled={isLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? dict.submitting : dict.submitButton}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {dict.orMagicLink}
          </span>
        </div>
      </div>

      {/* Magic link button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
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
