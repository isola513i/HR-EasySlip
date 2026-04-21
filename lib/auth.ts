import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const BLOCKED_EMPLOYMENT_STATUSES = [
  "SUSPENDED",
  "RESIGNED",
  "TERMINATED",
] as const;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
    error: "/signin/error",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return true;

      const full = await prisma.user.findUnique({
        where: { id: user.id },
        include: { employee: true },
      });
      if (!full) return true;
      if (full.isDisabled) return false;
      const emp = full.employee;
      if (
        emp &&
        BLOCKED_EMPLOYMENT_STATUSES.includes(
          emp.employmentStatus as (typeof BLOCKED_EMPLOYMENT_STATUSES)[number],
        )
      ) {
        return false;
      }
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
