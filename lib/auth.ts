import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  magicLinkHtml,
  magicLinkText,
} from "@/lib/email/magic-link-template";
import { logAuthEvent } from "@/lib/audit/logger";
import { signInAttemptLimiter } from "@/lib/security/rate-limit";

const BLOCKED_EMPLOYMENT_STATUSES = [
  "SUSPENDED",
  "RESIGNED",
  "TERMINATED",
] as const;

const adapter = {
  ...PrismaAdapter(prisma),
  // The default Prisma adapter uses `session.delete()` which throws when
  // the record doesn't exist. This happens when the signIn callback rejects
  // a user (e.g. SUSPENDED) after NextAuth already attempted session creation.
  // Using `deleteMany` avoids the "record not found" error.
  deleteSession: async (sessionToken: string) => {
    await prisma.session.deleteMany({ where: { sessionToken } });
    return null;
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: to, url, provider }) {
        const { host } = new URL(url);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to,
            subject: `เข้าสู่ระบบ EasySlip HR · Sign in to ${host}`,
            html: magicLinkHtml({ url, host }),
            text: magicLinkText({ url, host }),
          }),
        });
        if (!res.ok) {
          throw new Error(
            "Resend error: " + JSON.stringify(await res.json()),
          );
        }
      },
    }),
  ],
  session: {
    strategy: "database",
    // Session expires after 8 hours of inactivity (1 work day).
    // NextAuth refreshes the expiry on every request, so active
    // users stay signed in. Idle sessions are cleaned up.
    maxAge: 8 * 60 * 60, // 8 hours in seconds
    // Refresh session expiry every 30 minutes of activity
    updateAge: 30 * 60, // 30 minutes in seconds
  },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
    error: "/signin/error",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return true;

      // Account lockout: peek (check without counting) — only record on actual failures
      const lockout = signInAttemptLimiter.peek(user.id);
      if (!lockout.success) {
        logAuthEvent("auth.blocked", user.id, {
          reason: "Account locked: too many failed sign-in attempts",
        }).catch(() => {});
        return "/signin?error=AccessDenied";
      }

      const full = await prisma.user.findUnique({
        where: { id: user.id },
        include: { employee: true },
      });
      if (!full) return true;

      if (full.isDisabled) {
        signInAttemptLimiter.record(user.id); // count this failure
        logAuthEvent("auth.blocked", user.id, {
          reason: "Account disabled",
        }).catch(() => {});
        return "/signin?error=AccessDenied";
      }
      const emp = full.employee;
      if (
        emp &&
        BLOCKED_EMPLOYMENT_STATUSES.includes(
          emp.employmentStatus as (typeof BLOCKED_EMPLOYMENT_STATUSES)[number],
        )
      ) {
        signInAttemptLimiter.record(user.id); // count this failure
        logAuthEvent("auth.blocked", user.id, {
          reason: `Employment status: ${emp.employmentStatus}`,
        }).catch(() => {});
        return "/signin?error=AccessDenied";
      }

      // Success — log sign-in (fire-and-forget)
      logAuthEvent("auth.signin", user.id).catch(() => {});
      return true;
    },
    async session({ session, user }) {
      if (!user?.id) return session;
      const emp = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          employeeCode: true,
          roles: true,
          firstNameTh: true,
          lastNameTh: true,
          employmentStatus: true,
        },
      });
      session.user.id = user.id;
      session.user.employee = emp;
      return session;
    },
  },
});
