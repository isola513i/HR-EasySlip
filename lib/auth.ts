import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { getControlPlane } from "@/lib/db/control-plane";
import { env } from "@/lib/env";
import {
  magicLinkHtml,
  magicLinkText,
} from "@/lib/email/magic-link-template";
import { signInAttemptLimiter } from "@/lib/security/rate-limit";

function getCpAdapter() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cp = getControlPlane() as any;
  return {
    ...PrismaAdapter(cp),
    // deleteSession via deleteMany avoids "record not found" when signIn callback rejects
    // after NextAuth already attempted session creation.
    deleteSession: async (sessionToken: string) => {
      await cp.session.deleteMany({ where: { sessionToken } });
      return null;
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  get adapter() {
    return getCpAdapter();
  },
  providers: [
    Resend({
      id: "email",
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
    maxAge: 8 * 60 * 60,
    updateAge: 30 * 60,
  },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
    error: "/signin/error",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const fallback = `${baseUrl}/workspaces`;
      let resolved: string;
      if (url.startsWith("/")) {
        resolved = `${baseUrl}${url}`;
      } else {
        try {
          const target = new URL(url);
          const appHost = new URL(baseUrl).host;
          resolved = target.host === appHost ? url : baseUrl;
        } catch {
          resolved = baseUrl;
        }
      }
      // Authenticated bare-root navigation has no meaning in this app — send
      // the user to /workspaces so they can resolve to their tenant dashboard.
      if (resolved === baseUrl || resolved === `${baseUrl}/`) return fallback;
      return resolved;
    },
    async signIn({ user }) {
      if (!user?.id) return true;

      const lockout = signInAttemptLimiter.peek(user.id);
      if (!lockout.success) {
        logCPAuthEvent("auth.blocked", user.id, { reason: "Account locked" }).catch(() => {});
        return false;
      }

      const cp = getControlPlane();
      const full = await cp.user.findUnique({
        where: { id: user.id },
        select: { isDisabled: true },
      });
      if (!full) return true;

      if (full.isDisabled) {
        signInAttemptLimiter.record(user.id);
        logCPAuthEvent("auth.blocked", user.id, { reason: "Account disabled" }).catch(() => {});
        return false;
      }

      logCPAuthEvent("auth.signin", user.id).catch(() => {});
      return true;
    },
    async session({ session, user }) {
      if (!user?.id) return session;

      const cp = getControlPlane();
      const full = await cp.user.findUnique({
        where: { id: user.id },
        select: {
          mustChangePassword: true,
          memberships: {
            where: { status: "ACTIVE" },
            select: {
              tenantId: true,
              role: true,
              employeeRecordId: true,
              status: true,
              tenant: { select: { slug: true } },
            },
          },
        },
      });

      session.user.id = user.id;
      session.user.mustChangePassword = full?.mustChangePassword ?? false;
      session.user.memberships =
        full?.memberships?.map((m) => ({
          tenantId: m.tenantId,
          tenantSlug: m.tenant.slug,
          role: m.role,
          employeeRecordId: m.employeeRecordId ?? "",
          status: m.status,
        })) ?? [];

      return session;
    },
  },
});

async function logCPAuthEvent(
  action: string,
  userId: string,
  meta?: { reason?: string },
): Promise<void> {
  const cp = getControlPlane();
  await cp.platformAuditLog.create({
    data: {
      actorId: null,
      tenantId: null,
      action,
      targetType: "CpUser",
      targetId: userId,
      metadata: meta ?? undefined,
    },
  });
}
