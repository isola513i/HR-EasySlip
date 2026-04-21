import type { EmploymentStatus, Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      employee: {
        id: string;
        employeeCode: string;
        roles: Role[];
        firstNameTh: string;
        lastNameTh: string;
        employmentStatus: EmploymentStatus;
      } | null;
    } & DefaultSession["user"];
  }
}
