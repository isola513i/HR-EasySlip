# EasySlip HR

Internal Human Resources Management System for EasySlip / Thunder Solution Co., Ltd.

**Production:** https://hr-easyslip.vercel.app

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript 6 |
| UI | shadcn/ui, Tailwind CSS 4, Noto Sans Thai |
| Backend | Bun runtime, Next.js API Routes |
| Database | PostgreSQL (NeonDB) + Prisma 6 |
| Auth | NextAuth v5 (Passwordless Magic Link via Resend) |
| Testing | Bun test (76 unit tests), Playwright (5 E2E specs) |
| Deploy | Vercel (Turbopack) |

## Features

### Employee Portal (Mobile-first PWA)
- Clock in/out with GPS capture
- Leave request with real-time quota check
- OT request (weekday 1.5x / holiday 3.0x)
- Profile self-service
- Notification preferences
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
- Immutable audit log on all mutations
- Rate limiting (per-userId on mutations)
- Idempotency layer (X-Idempotency-Key)
- Circuit breaker for email delivery

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) >= 1.3
- PostgreSQL (or [NeonDB](https://neon.tech/) account)
- [Resend](https://resend.com/) API key

### Setup

```bash
# Clone
git clone https://github.com/THUNDER-SOLUTION-CO-LTD/hr-system.git
cd hr-system

# Install
bun install

# Environment
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL, AUTH_SECRET, RESEND_API_KEY

# Database
bun run db:generate
bun run db:migrate
bun run db:seed

# Development
bun dev
```

### Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start dev server (Turbopack) |
| `bun run build` | Production build |
| `bun run test` | Run unit tests |
| `bun run test:e2e` | Run Playwright E2E tests |
| `bun run db:seed` | Seed demo data |
| `bun run db:studio` | Open Prisma Studio |

## Project Structure

```
app/                    # Next.js App Router pages + API routes
  api/v1/               # Versioned REST API (55+ endpoints)
  employee/             # Employee portal pages
  manager/              # Manager portal pages
  hr/                   # HR admin pages
components/             # React components (shadcn/ui based)
hooks/                  # Custom React hooks (12 hooks)
lib/                    # Backend services & utilities
  attendance/           # Clock-in/out, validation
  leave/                # Leave management, quotas, overflow
  overtime/             # OT calculation, approval
  payroll/              # Empeo export, cycle management
  employee/             # Employee CRUD, anonymization
  email/                # Notification templates, circuit breaker
  security/             # RBAC, rate limiting
  observability/        # Structured logger
  api/                  # Request handling, idempotency
prisma/                 # Schema + migrations + seed data
e2e/                    # Playwright E2E test specs
docs/                   # Design docs + Empeo templates
```

## API Documentation

Interactive API docs available at `/api/docs` (Scalar UI + OpenAPI spec).

## Environment Variables

See [`.env.local.example`](.env.local.example) for the full list with descriptions.

**Required:** `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`

## License

Proprietary - Thunder Solution Co., Ltd. All rights reserved.
