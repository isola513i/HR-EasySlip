"use server";

import { z } from "zod";
import { signIn } from "@/lib/auth";

const signInSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
});

export interface SignInActionState {
  status: "idle" | "sent" | "error";
  message?: string;
  email?: string;
}

export async function sendMagicLink(
  _prev: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง",
    };
  }

  try {
    await signIn("resend", {
      email: parsed.data.email,
      redirect: false,
    });
    return {
      status: "sent",
      email: parsed.data.email,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "ไม่สามารถส่งอีเมลได้";
    return {
      status: "error",
      message,
    };
  }
}
