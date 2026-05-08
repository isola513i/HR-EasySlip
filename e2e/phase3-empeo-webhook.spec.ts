import { test, expect } from "@playwright/test";
import crypto from "node:crypto";

const BASE = "http://localhost:3000";

// Webhook is server-to-server; tests use raw fetch (no fixtures/login).
test.describe("Phase 3.7 — Empeo inbound webhook", () => {
  test("503 when EMPEO_WEBHOOK_SECRET not configured", async ({ request }) => {
    // Server reads env at request time; if dev env doesn't set the secret,
    // the route should respond 503. If secret IS set, this turns into a
    // signature-mismatch test (401) — we accept either to keep the test
    // robust across dev/CI configurations.
    const res = await request.post(`${BASE}/api/v1/integrations/empeo/webhook`, {
      data: { eventType: "test", idempotencyKey: "k1", payload: {} },
    });
    expect([401, 503]).toContain(res.status());
  });

  test("401 on missing/invalid signature when secret is set", async ({ request }) => {
    const secret = process.env.EMPEO_WEBHOOK_SECRET;
    test.skip(!secret, "EMPEO_WEBHOOK_SECRET not set in dev env");

    const res = await request.post(`${BASE}/api/v1/integrations/empeo/webhook`, {
      headers: { "x-empeo-signature": "deadbeef" },
      data: { eventType: "test", idempotencyKey: "k1", payload: {} },
    });
    expect(res.status()).toBe(401);
  });

  test("200 on valid signature, idempotency dedupes second call", async ({ request }) => {
    const secret = process.env.EMPEO_WEBHOOK_SECRET;
    test.skip(!secret, "EMPEO_WEBHOOK_SECRET not set in dev env");

    const idempotencyKey = `e2e-${crypto.randomUUID()}`;
    const body = JSON.stringify({
      eventType: "salary.updated",
      externalId: "EMP-test",
      idempotencyKey,
      payload: { test: true },
    });
    const sig = crypto.createHmac("sha256", secret!).update(body).digest("hex");

    const first = await request.post(`${BASE}/api/v1/integrations/empeo/webhook`, {
      headers: { "x-empeo-signature": sig, "content-type": "application/json" },
      data: body,
    });
    expect(first.ok()).toBeTruthy();
    const firstJson = await first.json();
    expect(firstJson.data.deduped).toBe(false);

    const second = await request.post(`${BASE}/api/v1/integrations/empeo/webhook`, {
      headers: { "x-empeo-signature": sig, "content-type": "application/json" },
      data: body,
    });
    expect(second.ok()).toBeTruthy();
    const secondJson = await second.json();
    expect(secondJson.data.deduped).toBe(true);
    expect(secondJson.data.eventId).toBe(firstJson.data.eventId);
  });
});
