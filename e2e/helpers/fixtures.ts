import { test as base } from "@playwright/test";
import { loginAs } from "./auth";

type RoleName = "employee" | "manager" | "hr" | "ceo";

export const test = base.extend<{ role: RoleName }>({
  role: ["employee", { option: true }],

  page: async ({ page, role }, use) => {
    await loginAs(page, role);
    await use(page);
  },
});

export { expect } from "@playwright/test";
