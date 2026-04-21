# EasySlip Internal HR System — MVP Scope (Phase 1)

> **Context lock-in**
> - Tech Stack: Next.js (App Router) + Bun API + PostgreSQL (NeonDB)
> - Mobile Strategy: **PWA only**
> - Payroll Boundary: **Event-only** (Outbox pattern, HR ไม่คำนวณเงิน)
> - AI Scope (future): Policy Q&A Agent + Auto Anomaly Detection
> - Compliance: Thai Labor Law 2025 + PDPA (Privacy by Design) + Zero Trust / RBAC
> - Personas: Employee (Mobile-first) / Manager (Bulk Approval) / HR (Super Config)

---

## 1. Core Features (Must-have — Phase 1)

สิ่งที่ **ต้องมี** เพื่อให้ระบบใช้งานจริงวันแรก + ลดงาน HR ได้ทันที + ปลอดภัยทางกฎหมาย

### 1.1 Identity & Access Foundation
- **SSO (Google Workspace) + Session with Zero Trust** — ไม่สร้าง password เอง ลด attack surface
- **RBAC 3 tiers** (Employee / Manager / HR-Admin) + Least Privilege — เป็นเงื่อนไขพื้นฐานก่อน touch ข้อมูลคน
- **Audit Log (immutable, append-only)** — PDPA มาตรา 37 + Accountability principle

### 1.2 Employee Master Data (Single Source of Truth)
- **Profile + Org Chart (reporting line)** — ต้องมีก่อน เพราะทุกฟีเจอร์ reference `employee_id` + `manager_id`
- **Self-service edit (ข้อมูลส่วนตัว)** — ลดงาน HR update เบอร์โทร/ที่อยู่ + อนุญาตตาม PDPA Data Subject Right
- **PDPA Consent Registry** — เก็บ consent purpose/version/timestamp ต่อ record

### 1.3 Attendance (Clock-in/out)
- **PWA Geolocation clock-in/out** — ไม่ต้อง geofence เข้ม Phase 1 แค่ log lat/long + accuracy
- **Work schedule (default shift)** — เก็บเวลาเริ่ม/เลิกงาน ไว้คำนวณ late/early-out
- **Timesheet view** (พนักงาน: ตัวเอง / หัวหน้า: ทีม) — โปร่งใส ลด dispute

### 1.4 Leave Management
- **Leave Types ตามกฎหมายไทย 2025**: ลาป่วย / ลากิจ / พักร้อน / **ลาคลอด 98 วัน** / ลาทำหมัน / ลาอุปสมบท / ลารับราชการทหาร
- **Quota Engine** — validate balance + accrual rule (prorate สำหรับ new hire)
- **Request → Approval flow (single approver = direct manager)** — bulk approve ใน manager inbox
- **Hard-stop rules**: ห้ามลาพักร้อนเกินสิทธิ, ห้ามลาคลอดน้อยกว่า 98 วัน ถ้า enroll เป็น leave ชนิดนี้

### 1.5 OT Management
- **OT Request (pre-approval required)** — กันการจ่ายย้อนหลังไม่มีหลักฐาน
- **OT Rate classifier**: 1.5x (วันทำงาน) / 2x (วันหยุด ในเวลา) / 3x (วันหยุด นอกเวลา) — ตาม พ.ร.บ. คุ้มครองแรงงาน
- **Daily/Weekly cap warning** — ป้องกัน OT เกิน 36 ชม./สัปดาห์ (hard limit ตาม กม.)
- ⚠️ **HR System คำนวณ "ชั่วโมงและ rate multiplier" เท่านั้น ไม่คำนวณเงิน** — ส่ง event ให้ Payroll เอง

### 1.6 Manager Inbox (Bulk Approvals)
- **Unified approval queue** (leave + OT + attendance correction ทีเดียว)
- **Bulk approve/reject with comment** — target persona 2 โดยตรง
- **Team overview dashboard** (today's attendance + pending approvals + leave calendar)

### 1.7 Payroll Outbox (Event-only Integration)
- **Outbox table + event emitter**: `leave.approved`, `ot.approved`, `attendance.finalized`, `employee.changed`
- **Signed JSON payload + idempotency key** — Payroll consume ได้หลายครั้งโดยไม่ผิด
- **Cut-off lock**: ปิด edit record เมื่อ payroll consume แล้ว — กัน retroactive change

### 1.8 Notification
- **Web Push (PWA) + Email fallback** — approve/reject/reminder
- **No SMS** Phase 1 (cost + unnecessary)

### 1.9 HR Admin Console
- **Leave policy configurator** (quota, accrual, carry-over) — no hard-code
- **Holiday calendar (Thai public holidays)** — import ได้
- **User management + role assignment**
- **Export CSV** (attendance, leave, OT) — HR ใช้ส่ง payroll manual ใน Phase 1 ถ้า event ยังไม่ connect

---

## 2. Phase 2 / Backlog (ว้าวแต่เก็บไว้ก่อน)

| Feature | เหตุผลที่เลื่อน |
|---|---|
| **Onboarding flow** (e-signature, asset, probation) | ไม่ daily-use, ทำ manual ได้ก่อน |
| **Performance Review (OKR/KPI/360)** | ทำรายไตรมาส — ยังมี Google Form อยู่ได้ |
| **Policy Q&A Agent (RAG)** | ต้องมี policy corpus + vector store ก่อน, ต้อง Phase 1 generate log มาก่อน |
| **Auto Anomaly Detection (AI)** | ต้องการ baseline data 2-3 เดือนก่อนจะ train ได้ |
| **Attrition Risk / GenAI Review Writer** | depend on Review module |
| **Shift Scheduling & Roster** | EasySlip เป็น office-based น่าจะไม่ critical |
| **Training / LMS** | แยก product, integrate ผ่าน API ก็ได้ |
| **Expense & Claims** | อยู่ระหว่าง HR/Finance boundary — ยังไม่ urgent |
| **Offboarding (asset return, exit interview)** | ทำ checklist manual ได้ |
| **Document Vault + E-signature** | ใช้ Google Drive + DocuSign ไปก่อน |
| **Geofence (hard boundary)** | เพิ่มหลังมี real data ว่าพนักงาน clock-in ผิดจุดบ่อยแค่ไหน |
| **Biometric / Face recognition clock-in** | PDPA sensitive data — ต้อง DPIA ก่อน |
| **Native app (iOS/Android)** | PWA พอสำหรับ Phase 1-2 |

---

## 3. Quick Wins (Development Order)

ลำดับที่ **เขียนโค้ดก่อน-หลัง** เพื่อเห็นผลเร็ว + unblock ฟีเจอร์อื่น

### 🟢 Sprint 1 (Week 1-2) — Foundation ที่ขาดไม่ได้
1. **DB Schema + Migrations** (`employee`, `role`, `permission`, `audit_log`, `consent_record`)
2. **Auth + Session (Google SSO)**
3. **RBAC middleware + API scaffolding (Bun)**
4. **Employee Master (CRUD by HR) + Self-service read**
5. **PWA shell + navigation + design tokens (shadcn/ui)**

> **ทำไมก่อน**: ทุก feature หลังจากนี้ depend on `employee_id`, `auth`, `audit_log`

### 🟢 Sprint 2 (Week 3-4) — Attendance = Daily Habit ⭐ ROI สูงสุด
6. **Clock-in/out API + PWA UI** (geolocation only, ไม่ geofence)
7. **Work schedule model + late/early-out detection**
8. **Timesheet view (self + team)**
9. **Manager team overview dashboard (attendance today)**

> **ทำไมรอง**: ใช้ทุกวัน → adoption signal ชัดเร็วสุด, demo ให้ทีมเห็นได้ใน 2 สัปดาห์

### 🟢 Sprint 3 (Week 5-6) — Leave = ลดงาน HR ทันที
10. **Leave types + quota engine (Thai Law hard-stops)**
11. **Request/Approval flow + Manager inbox (single + bulk approve)**
12. **Leave calendar (team view)**
13. **Notification (Web Push + Email)**

> **ทำไมรอง**: แทนที่ Google Form/LINE chaos ได้ใน 1 sprint, HR เห็น time-saved ทันที

### 🟢 Sprint 4 (Week 7-8) — OT + Payroll Contract + Audit
14. **OT request + 1.5x/2x/3x classifier + weekly cap warning**
15. **Outbox table + event emitter (signed payload, idempotency)**
16. **Payroll integration spec document** (⚠️ **ต้อง sync กับ Payroll team ก่อนเขียน contract — ห้ามคิดแทน**)
17. **Audit log viewer + CSV export + PDPA consent screen**

> **ทำไมสุดท้าย**: OT ต้อง clear payroll contract ก่อน, เสี่ยง rework ถ้าเขียนก่อน alignment

### 🟢 Sprint 5 (Week 9-10) — Polish & Ship
18. **HR Admin Console (policy config, holiday, user mgmt)**
19. **E2E tests (Playwright) — attendance, leave, OT flows**
20. **Load test + monitoring (Sentry + Axiom/Grafana)**
21. **PDPA DPIA document + Security review**

---

## 4. Decisions ที่ยังต้องถามก่อน Sprint เริ่ม

| # | ประเด็น | ทำไมต้อง clarify |
|---|---|---|
| 1 | Payroll software ตอนนี้ใช้ตัวไหน? | กำหนด event schema |
| 2 | EasySlip มี existing SSO / Identity Provider หรือยัง? | choose Google Workspace vs custom |
| 3 | จำนวนพนักงาน + growth 12 เดือน? | กำหนด scale baseline (pagination, caching) |
| 4 | Cut-off date ของ payroll แต่ละเดือน (วันที่เท่าไหร่)? | lock window ใน Outbox |
| 5 | นโยบาย carry-over leave (วันลาพักร้อนทบได้ไหม/กี่วัน)? | กำหนด quota engine logic |
| 6 | Probation period policy (ระหว่าง probation ลาอะไรได้บ้าง)? | กำหนด quota rule |
| 7 | WFH/Hybrid นับเป็น attendance แบบไหน? | geolocation rule |

---

## 5. DO / DON'T สำหรับ Phase 1

**DO**
- ใช้ Outbox pattern ตั้งแต่วันแรก (ง่ายกว่า retrofit)
- เขียน Thai Law rule เป็น config/policy file (ไม่ hard-code) — กฎหมายเปลี่ยนบ่อย
- Audit log ทุก mutation ที่แตะ personal data
- PWA + Web Push ตั้งแต่ Sprint 1 shell (ไม่ต้องรอ)

**DON'T**
- อย่าเริ่มจาก Onboarding/Review — low frequency, ไม่เห็น ROI เร็ว
- อย่าสร้าง Payroll calculator ใน HR — ขอบเขตของ Payroll team
- อย่าเก็บ biometric/face data Phase 1 — PDPA sensitive, ต้อง DPIA
- อย่าทำ native app Phase 1 — PWA พอ, ลด maintenance 50%
- อย่า hard-code leave quota — ต้อง configurable ตาม position/seniority
