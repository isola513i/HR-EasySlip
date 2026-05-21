"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";

const MIN_LENGTH = 8;

export function ChangePasswordForm({ firstTimeSetup = false }: { firstTimeSetup?: boolean }) {
  const t = useT();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const lengthOk = newPassword.length >= MIN_LENGTH;
  const matchOk = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = useMemo(
    () => lengthOk && matchOk && (firstTimeSetup || currentPassword.length > 0) && !isLoading,
    [lengthOk, matchOk, firstTimeSetup, currentPassword, isLoading],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;

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

      router.push("/workspaces");
      router.refresh();
    } catch {
      setError(t.common.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7" noValidate>
      {!firstTimeSetup && (
        <Field id="currentPassword" label={t.password.currentPassword}>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            disabled={isLoading}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
        </Field>
      )}

      <Field id="newPassword" label={t.password.newPassword}>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          value={newPassword}
          onChange={setNewPassword}
          disabled={isLoading}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
        />
        <Hint active={newPassword.length > 0} satisfied={lengthOk}>
          {t.password.minLength}
        </Hint>
      </Field>

      <Field id="confirmPassword" label={t.password.confirmPassword}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          disabled={isLoading}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
        />
        <Hint active={confirmPassword.length > 0} satisfied={matchOk}>
          {t.password.matchHint}
        </Hint>
      </Field>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="h-11 w-full text-[15px] font-medium"
        disabled={!canSubmit}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t.password.changing}
          </>
        ) : (
          firstTimeSetup ? t.password.setupButton : t.password.changeButton
        )}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[13px] font-medium text-foreground/85">
        {label}
      </Label>
      {children}
    </div>
  );
}

function PasswordInput({
  id,
  autoComplete,
  value,
  onChange,
  disabled,
  show,
  onToggle,
}: {
  id: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={show ? "" : "••••••••"}
        className="h-11 pr-10 placeholder:tracking-[0.3em] placeholder:text-muted-foreground/40"
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-0 top-0 grid h-11 w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function Hint({
  active,
  satisfied,
  children,
}: {
  active: boolean;
  satisfied: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[12px] transition-colors duration-200",
        !active && "text-muted-foreground/70",
        active && satisfied && "text-emerald-600",
        active && !satisfied && "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "grid size-3.5 place-items-center rounded-full border transition-colors duration-200",
          !active && "border-muted-foreground/30",
          active && satisfied && "border-emerald-600 bg-emerald-600 text-white",
          active && !satisfied && "border-muted-foreground/40",
        )}
        aria-hidden
      >
        {active && satisfied && <Check className="size-2.5" strokeWidth={3.5} />}
      </span>
      {children}
    </p>
  );
}
