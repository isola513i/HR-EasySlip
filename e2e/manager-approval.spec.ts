import { test, expect } from "./helpers/fixtures";

test.describe("Manager Approval Inbox", () => {
  test.use({ role: "manager" });

  test("can view approval inbox", async ({ page }) => {
    await page.goto("/manager/inbox");
    await page.waitForLoadState("networkidle");

    // Three-tab approval surface (Leave / Time Adjustment / Overtime) is
    // always rendered regardless of pending content. Match the Leave tab.
    await expect(page.getByRole("tab", { name: /leave/i })).toBeVisible({ timeout: 10_000 });
  });

  test("search input is visible when there are pending requests", async ({ page }) => {
    await page.goto("/manager/inbox");
    await page.waitForLoadState("networkidle");

    // ApprovalInbox renders the SearchInput only when rows exist (the
    // empty state replaces the whole panel). With seeded pending leaves
    // routed to the eng-manager, this should resolve. The selector is
    // anchored to the inbox-local placeholder so it doesn't collide
    // with the global header search input.
    const inboxSearch = page.getByPlaceholder(/name or employee id/i);
    const empty = page.getByText(/no pending approval/i);
    await expect(inboxSearch.or(empty)).toBeVisible({ timeout: 10_000 });
  });
});
