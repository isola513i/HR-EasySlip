-- Add structured meta + refId for idempotency, make title/body optional
ALTER TABLE "Notification"
  ADD COLUMN "meta" JSONB,
  ADD COLUMN "refId" TEXT,
  ALTER COLUMN "title" DROP NOT NULL,
  ALTER COLUMN "body" DROP NOT NULL;

-- DB-level idempotency: one row per (user, kind, refId).
-- Allows multiple notifications when refId is null (e.g., generic system
-- alerts) by virtue of NULL never being equal to NULL in unique indexes.
CREATE UNIQUE INDEX "Notification_userId_kind_refId_key"
  ON "Notification"("userId", "kind", "refId");
