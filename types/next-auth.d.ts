import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      mustChangePassword: boolean;
      /** Active TenantMemberships for this user. Populated by session callback. */
      memberships: Array<{
        tenantId: string;
        tenantSlug: string;
        /** Primary role string e.g. "TENANT_ADMIN" | "HRMG" | "EMPLOYEE" */
        role: string;
        /** Employee.id in tenant DB (loose cross-silo reference) */
        employeeRecordId: string;
        status: string;
      }>;
    } & DefaultSession["user"];
  }
}
