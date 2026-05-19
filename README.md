# EasySlip HR

Internal Human Resources Management System for EasySlip / Thunder Solution Co., Ltd.

**Production:** https://hr-easyslip.vercel.app

## Architecture

EasySlip HR is a **multi-tenant SaaS platform** using a silo architecture: each tenant gets a fully isolated PostgreSQL database on NeonDB. A shared *control-plane* database tracks tenants, plans, billing, and trials. Tenant routing is subdomain-based — `{slug}.easyslip.app` resolves to the correct tenant.

```
                 ┌─────────────────────────────────────┐
                 │  easyslip.app  (marketing + signup)  │
                 └─────────────────────────────────────┘
                 ┌─────────────────────────────────────┐
                 │  easyslip.app/platform  (superadmin) │
                 │  tenant mgmt · billing · impersonate │
                 └─────────────────────────────────────┘
   ┌──────────────────┐          ┌──────────────────┐
   │ acme.easyslip.app│    …     │ demo.easyslip.app │
   │  (Tenant A DB)   │          │  (Tenant B DB)   │
   └──────────────────┘          └──────────────────┘
          ↕  all tenants share                ↕
   ┌────────────────────────────────────────────────┐
   │  Control-plane DB  (NeonDB — platform-wide)    │
   │  tenants · plans · trials · audit · team       │
   └────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS 4, Noto Sans Thai |
| Backend | Bun runtime, Next.js API Routes |
| Database | PostgreSQL (NeonDB) + Prisma 6 — control-plane + per-tenant silo |
| Auth | NextAuth v5 (Email+Password + Magic Link via Resend) |
| Testing | Bun test, Playwright (5 E2E spec phases) |
| Deploy | Vercel (Turbopack) |

## Features

### Marketing & Signup
- Public landing page with tenant signup flow
- Trial provisioning — new tenant DB spun up automatically

### Superadmin Platform (`/platform`)
- Tenant directory: create, provision, suspend, delete
- Plan & billing management
- Superadmin impersonation (audit-logged, time-limited)
- Platform team management

### Employee Portal (Mobile-first PWA)
- Clock in/out with GPS capture
- Leave request with real-time quota check
- OT request (weekday 1.5× / holiday 3.0×)
- Profile self-service
- Push notifications (Web Push / VAPID)
- Offline support (IndexedDB queue + auto-replay)

### Manager Portal
- Unified approval inbox (leave + OT)
- Bulk approve/reject with reason dialog
- Team attendance & leave calendar

### HR Admin Portal
- Employee directory with CRUD + onboarding
- Leave calendar (team-wide view)
- Attendance overview
- Holiday management (CRUD)
- Payroll export (CSV timestamps + Excel payroll/employee data)
- Dashboard analytics (real-time)
- Audit log viewer with search + pagination
- PDPA consent management
- System settings
- Employee anonymization (PDPA Article 33)

### Compliance & Security
- Thai Labor Law 2568 compliant (leave quotas, OT rates, cut-off rules)
- PDPA consent gate on all protected routes
- RBAC with 8 roles (EMPLOYEE, MANAGER, HR_AUTHORIZED, HRMG, CEO, CTO, COO, ADMIN)
- Immutable audit log on all mutations (both control-plane and tenant level)
- Rate limiting (per-userId on mutations)
- Idempotency layer (X-Idempotency-Key)
- Circuit breaker for email delivery
- Superadmin impersonation with full audit trail

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) >= 1.3
- Two NeonDB projects (or one project with two databases) — control-plane + tenant
- [Resend](https://resend.com/) API key
- (Optional) [VAPID keys](https://web.dev/push-notifications-web-push-protocol/) for push notifications

### Setup

```bash
# Clone
git clone https://github.com/THUNDER-SOLUTION-CO-LTD/hr-system.git
cd hr-system

# Install
bun install

# Environment
cp .env.example .env.local
# Fill in all values — see .env.example for full documentation
```

#### Subdomain routing in development

The middleware reads the subdomain to identify the tenant. Add an entry to `/etc/hosts`:

```
127.0.0.1  demo.localhost
```

Then open `http://demo.localhost:3000` — the app will route to the `demo` tenant.

Alternatively use [Caddy](https://caddyserver.com/) or [localias](https://github.com/peterldowns/localias) for automatic wildcard subdomain proxying.

#### Database setup

```bash
# 1. Generate Prisma clients (control-plane + tenant schemas)
bun run db:generate

# 2. Run migrations on control-plane DB
bun run db:migrate

# 3. Seed platform admin + demo tenant
bun run db:seed

# (optional) Open Prisma Studio for the tenant DB
bun run db:studio
```

In CI / production, run migrations before the build:

```bash
bun run db:migrate:deploy   # prisma migrate deploy (no interactive prompt)
bun run build
```

#### Start development server

```bash
bun dev
```

### Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start dev server (Turbopack) |
| `bun run build` | Production build |
| `bun run test` | Run unit tests |
| `bun run test:e2e` | Run Playwright E2E tests (all phases) |
| `bun run db:generate` | Generate Prisma clients |
| `bun run db:migrate` | Run migrations (dev, interactive) |
| `bun run db:migrate:deploy` | Run migrations (CI/prod, non-interactive) |
| `bun run db:seed` | Seed control-plane + demo tenant |
| `bun run db:studio` | Open Prisma Studio |

## Project Structure

```
app/
  (marketing)/            # Public landing pages + signup
  (tenant)/               # Tenant-scoped app (subdomain routing)
    employee/             # Employee portal pages
    manager/              # Manager portal pages
    hr/                   # HR admin pages
  platform/               # Superadmin portal (no subdomain)
    tenants/              # Tenant CRUD + provisioning + impersonation
    plans/                # Plan management
    trials/               # Trial extension / conversion
    team/                 # Platform team management
  api/v1/                 # Versioned REST API (55+ endpoints)
  signup/                 # New tenant self-signup
  tenant-not-found/       # Shown when subdomain has no matching tenant

components/               # React components (shadcn/ui based)
hooks/                    # Custom React hooks
lib/
  attendance/             # Clock-in/out, validation
  leave/                  # Leave management, quotas, overflow
  overtime/               # OT calculation, approval
  payroll/                # Empeo export, cycle management
  employee/               # Employee CRUD, anonymization
  email/                  # Notification templates, circuit breaker
  security/               # RBAC, rate limiting, impersonation
  observability/          # Structured logger
  api/                    # Request handling, idempotency
  i18n/                   # Internationalization (en + th dictionaries)
  tenant/                 # Tenant resolution, DB connection routing
prisma/                   # Schemas + migrations (control-plane + tenant)
e2e/                      # Playwright E2E specs (phases A–E)
  phase-a-tenant-routing  # Subdomain routing + tenant isolation
  phase-b-platform        # Superadmin portal flows
  phase-c-marketing       # Signup + marketing pages
  phase-d-tenant-settings # Tenant configuration
  phase-e-security        # Impersonation, RBAC, audit
middleware.ts             # Subdomain → tenant resolution + auth guard
```

## Environment Variables

See [`.env.example`](.env.example) for the full list with descriptions.

**Required for multi-tenant operation:**

| Variable | Purpose |
|----------|---------|
| `CONTROL_PLANE_DATABASE_URL` | Pooled connection to platform-wide DB |
| `CONTROL_PLANE_DIRECT_URL` | Direct connection (migrations) |
| `CONTROL_PLANE_ENCRYPTION_KEY` | AES-256 key for tenant connection strings (64 hex chars) |
| `DATABASE_URL` | Pooled connection to tenant DB (dev: single tenant) |
| `DIRECT_URL` | Direct connection to tenant DB |
| `ROOT_DOMAIN` | Apex domain — subdomains derive from this |
| `PLATFORM_SESSION_SECRET` | Signs the superadmin portal session JWT |
| `PLATFORM_ADMIN_EMAIL` | Initial platform admin email |
| `PLATFORM_ADMIN_PASSWORD` | Initial platform admin password |
| `IMPERSONATION_COOKIE_VALUE` | Sentinel value for impersonation session cookie |
| `AUTH_SECRET` | NextAuth session signing key |
| `RESEND_API_KEY` | Transactional email (magic links, invites) |
| `EMAIL_FROM` | Verified sender address on Resend |

## API Documentation

Interactive API docs available at `/api/docs` (Scalar UI + OpenAPI spec).

## License

Proprietary — Thunder Solution Co., Ltd. All rights reserved.
