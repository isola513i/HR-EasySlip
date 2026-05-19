-- CreateTable
CREATE TABLE "Plan" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceTHB" INTEGER,
    "maxEmployees" INTEGER,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("code")
);

-- Seed initial plans (mirror the previous hardcoded PLAN_CATALOG)
INSERT INTO "Plan" ("code", "name", "priceTHB", "maxEmployees", "features", "sortOrder", "updatedAt") VALUES
('starter', 'Starter', 990, 30,
  ARRAY['GPS Clock-in / Clock-out', 'Leave management', 'Basic OT tracking', '1 admin user', 'Email support'],
  0, CURRENT_TIMESTAMP),
('pro', 'Pro', 1990, 100,
  ARRAY['Everything in Starter', 'Expense claims', 'Empeo CSV export', 'Advanced HR reports', '3 admin users', 'Priority support'],
  1, CURRENT_TIMESTAMP),
('enterprise', 'Enterprise', NULL, NULL,
  ARRAY['Everything in Pro', 'Unlimited employees', 'Custom integrations', 'Dedicated SLA', 'Unlimited admins', 'Onboarding support'],
  2, CURRENT_TIMESTAMP);
