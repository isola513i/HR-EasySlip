"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/locale-context";

export function ForgotPasswordForm({ slug: slugProp }: { slug?: string }) {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ slug?: string }>();
  const slug = slugProp ?? params.slug ?? "";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentPath = slug ? `/${slug}/signin/forgot-password/sent` : "/signin/forgot-password/sent";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t.password.forgotEmailRequired);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? t.common.genericError);
        return;
      }

      router.push(`${sentPath}?email=${encodeURIComponent(email)}`);
    } catch {
      setError(t.common.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fp-email">{t.password.forgotEmail}</Label>
        <Input
          id="fp-email"
          type="email"
          autoComplete="email"
          placeholder={t.signin.emailPlaceholder}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          disabled={isLoading}
          className={error ? "border-destructive" : ""}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t.password.forgotSending : t.password.forgotSend}
      </Button>
    </form>
  );
}
