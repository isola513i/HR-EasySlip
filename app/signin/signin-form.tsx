"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  sendMagicLink,
  type SignInActionState,
} from "./actions";

const initialState: SignInActionState = { status: "idle" };

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(
    sendMagicLink,
    initialState,
  );

  if (state.status === "sent") {
    return (
      <div className="space-y-3 text-sm">
        <p>
          ส่ง magic link ไปที่ <strong>{state.email}</strong> แล้ว
        </p>
        <Link
          href="/signin/check-email"
          className="text-primary underline underline-offset-4"
        >
          ดูรายละเอียดเพิ่มเติม
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="name@company.co.th"
          disabled={isPending}
        />
        {state.status === "error" && state.message ? (
          <p className="text-destructive text-sm">{state.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "กำลังส่ง..." : "ส่ง magic link"}
      </Button>
    </form>
  );
}
