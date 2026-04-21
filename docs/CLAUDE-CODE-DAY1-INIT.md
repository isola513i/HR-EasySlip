# Claude Code — Day 1 Project Init Handoff

> **For:** Ice (Part-time Vibe Code Developer @ EasySlip)
> **Target Runtime:** Tue 2026-04-21, 18:00–24:00 TH (6 hrs)
> **Deadline:** 2026-05-02 (11 working days remain)
> **File Purpose:** Self-contained prompt to paste into Claude Code at `D:\EasySlip`

---

## 📋 How to Use This File

1. เปิด terminal → `cd D:\EasySlip`
2. Run `claude` เพื่อเปิด Claude Code
3. Copy **ทั้งหมดตั้งแต่ `# MISSION` จนจบไฟล์** → paste เข้า Claude Code
4. พอถึง **Step 5** Claude Code จะหยุดรอ → กรอก `.env.local` ตาม template แล้วพิมพ์ `ready`
5. กลับมาเช็ก chat ทุก 15-20 นาที
6. จบแล้วตรวจ 12-checkpoint report ที่ Claude Code แปะกลับมา

---

## ⚠️ Human Steps (ต้องทำเอง — Claude Code ทำไม่ได้)

- **Step 5 (env setup)** — Claude Code ถูก block จาก `.env.local` ต้อง copy `.env.local.example → .env.local` แล้วกรอกค่าจริงเอง
- **NeonDB extensions** — ถ้า migrate fail ต้องเปิด Neon console รัน `CREATE EXTENSION` ด้วยมือ
- **Resend domain verify** — dev ใช้ `onboarding@resend.dev` ได้เลย; prod ต้อง verify DNS ก่อน

---

## 🎯 Fallback ถ้า Claude Code ค้าง > 10 นาที

| Step | Workaround |
|---|---|
| 2 (scaffold) | รัน `bun create next-app` ใน temp dir แล้ว rsync กลับ |
| 6 (migrate) | เปิด Neon console รัน `CREATE EXTENSION IF NOT EXISTS citext; CREATE EXTENSION IF NOT EXISTS pg_trgm;` แล้ว retry |
| 9 (seed) | รัน `bun prisma/seed.ts` ตรงๆ ดู stack trace |
| 10 (NextAuth) | ส่ง error กลับให้ Ice เขียน config ให้ตรงๆ |

---

═══════════════════════════════════════════════════════════════
**↓↓↓ COPY FROM HERE TO END ↓↓↓**
═══════════════════════════════════════════════════════════════

# MISSION

ทำ Project Init ให้ EasySlip Internal HR System (Phase 1 MVP) ในโฟลเดอร์ปัจจุบัน (`D:\EasySlip`). สร้าง foundation layer (scaffold + DB + auth + seed) ให้พร้อม build feature ต่อในคืนถัดไป — **ไม่ต้อง build UI หรือ business logic นอกเหนือจาก signin page**

# CONTEXT

- **ผู้สั่งงาน:** Ice (Nattapat Lamnui) — Part-time Vibe Code Developer @ EasySlip
- **Tech Stack (LOCKED):** Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui + Bun + Prisma + PostgreSQL (NeonDB) + NextAuth v5 (Magic Link via Resend)
- **Deadline:** 2026-05-02 (~11 working days)
- **Architecture:** MACH, API-first, Single Source of Truth, Strict RBAC, PDPA Privacy by Design
- **อ่านก่อนทำ:** `CLAUDE.md` ในโปรเจกต์ — ทำตาม Tech Stack, RBAC, Anti-Spaghetti rules เคร่งครัด

# CURRENT STATE (ห้ามลบ ห้ามแก้)

โฟลเดอร์นี้มีไฟล์ที่เตรียมไว้แล้ว:

```
CLAUDE.md                              # project instructions
HR-System-MVP-Scope.md                 # Phase 1 MVP scope
Attendance-Leave-System-Design.md      # full system design doc
.env.local.example                     # env template (ห้ามอ่าน .env.local)
prisma/schema.prisma                   # 17 models ready to migrate
prisma/seed.ts                         # orchestrator
prisma/seed/organization.ts            # 6 depts + 15 positions
prisma/seed/employees.ts               # 16 mock users
prisma/seed/leave-quotas.ts            # SICK/PERSONAL/ANNUAL
prisma/seed/public-holidays.ts         # Thai 2026 holidays
prisma/seed/system-config.ts           # 15 config keys
lib/leave/annual-quota-engine.ts       # production-ready engine
lib/leave/annual-quota-engine.test.ts  # 25+ Bun tests (ต้อง pass ทั้งหมด)
docs/CLAUDE-CODE-DAY1-INIT.md          # this file
```

# TASK (ทำตามลำดับ — หยุด + รายงานถ้ามี error)

## Step 1 — Preserve existing assets

- สร้าง temp dir นอก repo: `../easyslip-init-backup/`
- Copy ทุกไฟล์ + folder ปัจจุบันไปที่ temp dir (ยกเว้น `node_modules/`, `.next/` ถ้ามี)
- List ไฟล์ที่ backup แล้ว **pause confirm** กับ Ice ก่อน Step 2

## Step 2 — Scaffold Next.js 15

- ย้าย `CLAUDE.md`, `prisma/`, `lib/`, `docs/`, `*.md`, `.env.local.example` ออกไปที่ temp dir ชั่วคราว (เพื่อให้ `bun create next-app` ไม่บ่น)
- รัน:

  ```bash
  bun create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias="@/*" --no-eslint
  ```

  - ถ้า bun ถาม override → ตอบ **no** แล้วตรวจ working directory ก่อน
- Verify: มี `app/`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `package.json`, `postcss.config.mjs`
- Restore ทุกไฟล์จาก temp dir กลับมา (merge — next-app files + preserved files อยู่ด้วยกัน)
- Merge `.gitignore`: รวม rules ของทั้ง 2 ฝั่ง + เพิ่ม:

  ```
  .env
  .env.local
  .env*.local
  tmp/
  /prisma/migrations/dev.db*
  ```

## Step 3 — Install dependencies

รันทั้งชุดใน 1 command:

```bash
bun add @prisma/client next-auth@beta @auth/prisma-adapter resend date-fns zod react-hook-form @hookform/resolvers @t3-oss/env-nextjs
bun add -d prisma tsx @types/node
```

Verify: `package.json` มี deps ครบ

## Step 4 — Wire package.json scripts

Merge scripts + prisma config (เก็บ scripts เดิมที่ next-app generate ไว้ด้วย):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "test": "bun test"
  },
  "prisma": {
    "seed": "bun prisma/seed.ts"
  }
}
```

## Step 5 — Env confirmation (HUMAN STEP — หยุดรอ Ice)

- Verify `.env.local.example` ยังอยู่ (ห้ามอ่าน/แก้)
- แจ้ง Ice:
  1. Copy: `cp .env.local.example .env.local`
  2. กรอกค่าจริง:
     - `DATABASE_URL` + `DIRECT_URL` — จาก NeonDB console (Pooled + Direct)
     - `AUTH_SECRET` — รัน `bunx auth secret` แล้ว copy output
     - `RESEND_API_KEY` — จาก https://resend.com/api-keys
     - `EMAIL_FROM` — dev ใช้ `EasySlip HR <onboarding@resend.dev>` ได้เลย
- **หยุดรอ confirmation** — ขอให้ Ice พิมพ์ `ready` ก่อนไปต่อ
- ❌ ห้ามอ่าน `.env.local` ด้วย tool ใดๆ

## Step 6 — Prisma migrate + generate

```bash
bunx prisma generate
bunx prisma migrate dev --name init_hr_mvp
```

- Verify: 17 tables บน NeonDB (ผ่าน `bunx prisma studio` หรือ Neon console)
- ถ้า error เรื่อง `citext` / `pg_trgm` extensions → แจ้ง Ice เปิด Neon SQL Editor รัน:

  ```sql
  CREATE EXTENSION IF NOT EXISTS citext;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  ```

  แล้ว retry `bunx prisma migrate dev`

## Step 7 — Setup shadcn/ui

```bash
bunx shadcn@latest init
```

- Config: style=`new-york`, baseColor=`slate`, cssVars=`yes`
- Install primitives ที่จะใช้ใน Day 2:

  ```bash
  bunx shadcn@latest add button card badge table dialog input label form select calendar dropdown-menu tabs sonner sheet avatar separator skeleton
  ```

- Verify: `components/ui/` มี ≥15 ไฟล์

## Step 8 — Run tests BEFORE seed

```bash
bun test lib/leave/annual-quota-engine.test.ts
```

- ต้อง pass ทั้งหมด (25+ tests, 0 fail)
- ถ้า fail → **หยุด + report** error stack trace

## Step 9 — Seed mock data

```bash
bun db:seed
```

Verify:
- Log แสดง `✅ Seed complete` + รายการ sign-in emails
- `bunx prisma studio` เห็น: 16 employees, 6 departments, 15 positions, 21 public holidays, 15 system configs

## Step 10 — NextAuth v5 minimal scaffold

สร้างไฟล์ต่อไปนี้ (keep minimal — extend ใน Day 2):

### `lib/env.ts`

Type-safe env parsing with `@t3-oss/env-nextjs` + Zod. Export validated env object.

### `lib/prisma.ts`

Singleton PrismaClient (handle hot-reload ใน dev):

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['warn', 'error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### `lib/auth.ts`

NextAuth v5 config:
- Adapter: `PrismaAdapter(prisma)`
- Provider: Resend (magic link)
- Session strategy: `database`
- Callbacks:
  - `signIn`: block if `user.isDisabled` OR employee status `SUSPENDED`/`TERMINATED`/`RESIGNED`
  - `session`: inject `user.id`, `user.employee.id`, `user.employee.roles`, `user.employee.employeeCode`
- Pages: `signIn: '/signin'`, `verifyRequest: '/signin/check-email'`, `error: '/signin/error'`

### `app/api/auth/[...nextauth]/route.ts`

Export `GET`, `POST` handlers from `lib/auth.ts`

### `middleware.ts`

Wrap with NextAuth `auth`:
- Protect `/hr/*`, `/employee/*`, `/manager/*` — redirect `/signin` if unauthenticated
- Public routes: `/`, `/signin/*`, `/api/auth/*`

### `app/signin/page.tsx`

- Server component shell + client form
- shadcn `Form` + `Input` + `Button`
- Action: `signIn('resend', { email, redirectTo: '/' })`
- Link to `/signin/check-email` on success

### `app/signin/check-email/page.tsx`

Static success message: "เช็กอีเมล `{email}` เพื่อ sign in"

**Requirements:**
- SoC: business logic ไม่อยู่ใน route — service ไป `lib/services/*`
- Server actions ใช้ `zod` validate input
- ห้าม hard-code URL — อ่านจาก `env.AUTH_URL`
- ทุกไฟล์ ≤150 lines (ถ้าเกิน refactor ทันที)

## Step 11 — Smoke test

- รัน `bun dev`
- เปิด `http://localhost:3000/signin`
- กรอก email `development.v001@gmail.com` → กด "Send magic link"
- ตรวจ inbox → click magic link → ต้อง redirect กลับพร้อม session
- เปิด `http://localhost:3000/hr/` → ควรเข้าได้ (HRMG role)
- Sign out → retry `/hr/` → ต้อง redirect `/signin`
- Stop `bun dev` หลัง test ผ่าน

## Step 12 — Git commit (atomic)

```bash
git add CLAUDE.md *.md docs/
git commit -m "docs: add MVP scope, system design, and handoff guide"

git add prisma/
git commit -m "feat(db): Prisma schema and mock seed (17 models, 16 employees)"

git add lib/leave/
git commit -m "feat(leave): annual quota engine with 25 test cases"

git add package.json bun.lockb tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs components.json .gitignore app/globals.css app/layout.tsx app/page.tsx app/favicon.ico public/
git commit -m "chore: scaffold Next.js 15 + Tailwind + shadcn/ui"

git add components/ui/
git commit -m "feat(ui): add shadcn primitives (button, card, form, table, ...)"

git add lib/env.ts lib/auth.ts lib/prisma.ts app/api/auth/ middleware.ts app/signin/
git commit -m "feat(auth): NextAuth v5 magic link via Resend + RBAC middleware"

git add .env.local.example
git commit -m "chore: env template for local dev"
```

# CONSTRAINTS (ห้ามทำ)

- ❌ ห้ามแตะ `.env.local` (อ่าน/เขียน/ดู contents) — ถ้าต้องดู ให้ Ice paste ค่ามาเอง
- ❌ ห้ามสร้าง UI components นอกเหนือจาก signin + check-email pages
- ❌ ห้าม build business logic ของ Attendance / Leave / OT / Manager Inbox / Dashboard ยัง (Day 2+)
- ❌ ห้าม modify `lib/leave/annual-quota-engine.ts` หรือ test file
- ❌ ห้าม commit `.env.local`, `node_modules/`, `.next/`, `tmp/`
- ❌ ห้าม skip Step 5 confirmation — รอจริงๆ ถึง Ice พิมพ์ `ready`
- ❌ ห้าม install deprecated packages — ตรวจทุก dep ว่า maintained (release ภายใน 6 เดือน)
- ❌ ห้ามใช้ NextAuth v4 — ใช้ v5 beta (`next-auth@beta`) เท่านั้น
- ❌ ห้าม hard-code hex colors — รอ design tokens จาก Day 2
- ❌ ห้ามสร้าง README ใหม่ — append ใน `HR-System-MVP-Scope.md` ถ้าจำเป็น
- ❌ ห้ามใช้ emoji ใน code / comments (เฉพาะใน markdown ได้)

# VERIFICATION (Success Criteria)

ทั้ง 12 items ต้อง ✅ ครบก่อน report done:

1. ✅ `bun dev` รันได้ไม่ error
2. ✅ `http://localhost:3000` return 200
3. ✅ `bun test` pass 25+ tests (0 fail)
4. ✅ `bunx prisma studio` เห็น 16 employees + 6 departments + 15 positions
5. ✅ Magic link ส่งเข้า inbox `development.v001@gmail.com` ได้จริง
6. ✅ Sign in แล้วมี `Session` record ใน DB
7. ✅ `components/ui/` มี ≥15 shadcn components
8. ✅ `git log --oneline` เห็น 7 commits ด้วย conventional commit messages
9. ✅ `.env.local` ไม่อยู่ใน `git status` (อยู่ใน .gitignore)
10. ✅ `bunx tsc --noEmit` ไม่มี type error
11. ✅ Middleware block `/hr`, `/employee`, `/manager` ถ้าไม่มี session
12. ✅ Sign in ด้วย email ของ ES0016 (ปรีชา ใจดี — SUSPENDED) **ถูก block** (callback `signIn` return false)

# REPORT BACK

เมื่อครบทั้ง 12 items ให้ print สรุปใน chat (ห้ามสร้าง markdown file ใหม่):

```
═══════════════════════════════════════════════════════════
DAY 1 PROJECT INIT — REPORT
═══════════════════════════════════════════════════════════

✅ Verification: 12/12 passed

📁 New files:
  - app/signin/page.tsx
  - app/signin/check-email/page.tsx
  - app/api/auth/[...nextauth]/route.ts
  - lib/auth.ts
  - lib/prisma.ts
  - lib/env.ts
  - middleware.ts
  - components/ui/*.tsx (15 files)
  - [next-app scaffold files]

📝 Modified files:
  - .gitignore (merged)
  - package.json (added scripts + prisma config)

📊 Database:
  - 17 tables migrated
  - 16 employees seeded
  - 21 public holidays seeded
  - 15 system configs seeded

🧪 Tests:
  - annual-quota-engine: 25 passed, 0 failed

📦 Git commits: 7 atomic commits

🚪 Signin tested:
  - HRMG (development.v001@gmail.com): ✅ success
  - SUSPENDED (dev.v001+emp.preecha@gmail.com): ✅ blocked

⚠️ Issues encountered:
  [list any issues + workarounds, or "none"]

➡️ Recommended for Day 2 (Wed Apr 22, 18:00-24:00 TH):
  1. Integrate Claude Design tokens → tailwind.config.ts
  2. Build shared components: <RoleBadge />, <StatusPill />, <LeaveTypeChip />, <PageHeader />
  3. RBAC helper + hooks: useSession() wrapper, hasRole(), canViewSensitive()
  4. Skeleton pages: /hr/overview, /employee/today, /manager/inbox (empty states only)
  5. Demo #1 (20:00 Wed): sign in + role-gated nav visible per persona
═══════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════
**↑↑↑ COPY UP TO HERE ↑↑↑**
═══════════════════════════════════════════════════════════════
