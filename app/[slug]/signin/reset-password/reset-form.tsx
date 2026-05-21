"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/locale-context";

interface Props {
  token: string;
  email: string;
}

export function ResetPasswordForm({ token, email }: Props) {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const t = useT();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!token || !email) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>{t.password.resetInvalidLink}</p>
        <Link
          href={`/${slug}/signin/forgot-password`}
          className="inline-flex items-center gap-1.5 text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" /> {t.password.resetRequestNew}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(t.password.tooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.password.mismatch);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.common.genericError);
        return;
      }

      router.push(`/${slug}/signin?reset=success`);
    } catch {
      setError(t.common.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rp-new">{t.password.newPassword}</Label>
        <Input
          id="rp-new"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder={t.password.minLength}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rp-confirm">{t.password.confirmPassword}</Label>
        <Input
          id="rp-confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t.password.resetChanging : t.password.resetButton}
      </Button>
    </form>
  );
}
