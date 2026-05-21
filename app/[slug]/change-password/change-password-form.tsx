"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/locale-context";

export function ChangePasswordForm({ firstTimeSetup = false }: { firstTimeSetup?: boolean }) {
  const t = useT();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const body: Record<string, string> = { newPassword };
      if (!firstTimeSetup) body.currentPassword = currentPassword;

      const res = await fetch("/api/v1/employee/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.password.changeFailed);
        return;
      }

      router.push(`/${slug}/dashboard`);
      router.refresh();
    } catch {
      setError(t.common.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!firstTimeSetup && (
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t.password.currentPassword}</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t.password.newPassword}</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading}
          placeholder={t.password.minLength}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t.password.confirmPassword}</Label>
        <Input
          id="confirmPassword"
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
        {isLoading ? t.password.changing : t.password.changeButton}
      </Button>
    </form>
  );
}
