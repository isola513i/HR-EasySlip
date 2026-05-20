นี่คือ checklist ทุกอย่างที่ต้องทำบน Vercel ก่อน deploy:

---

1. Domain — Wildcard Subdomain (สำคัญที่สุด)  


Middleware routing ทำงานด้วย subdomain — ต้องเพิ่ม 2 domain ใน Vercel Dashboard → Domains:

┌────────────────┬───────────────────────────┐  
 │ Domain │ ใช้สำหรับ │  
 ├────────────────┼───────────────────────────┤  
 │ easyslip.app │ Marketing / apex │  
 ├────────────────┼───────────────────────────┤
│ \*.easyslip.app │ Tenant + admin subdomains │  
 └────────────────┴───────────────────────────┘

Vercel รองรับ wildcard ได้ตั้งแต่ Pro plan ขึ้นไป DNS ที่ Cloudflare/Registrar ต้องมี:  
 A easyslip.app → Vercel IP  
 CNAME \*.easyslip.app → cname.vercel-dns.com

---

2. Environment Variables ใหม่ทั้งหมด

ไปที่ Vercel Dashboard → Settings → Environment Variables แล้วเพิ่ม:

Control-Plane DB (NeonDB project ใหม่แยกต่างหาก)

CONTROL_PLANE_DATABASE_URL postgresql://...pooler...neon.tech/platform?...pgbouncer=true  
 CONTROL_PLANE_DIRECT_URL postgresql://...neon.tech/platform?sslmode=require  
 CONTROL_PLANE_ENCRYPTION_KEY <openssl rand -hex 32> ← ต้องยาว 64 chars

Multi-tenant routing

ROOT_DOMAIN easyslip.app  
 (เดิม default เป็น localhost:3000 — ถ้าไม่ set จะ broken ทั้งหมด)

Platform / Superadmin

PLATFORM_SESSION_SECRET <openssl rand -hex 32>  
 PLATFORM_ADMIN_EMAIL admin@easyslip.app  
 PLATFORM_ADMIN_PASSWORD <strong password>
PLATFORM_SUPPORT_EMAIL support@easyslip.app  
 PLATFORM_SUPPORT_PASSWORD <strong password>  
 TRIAL_DURATION_DAYS 14  
 SIGNUP_NOTIFICATION_EMAIL alerts@easyslip.app
ALERT_EMAIL ops@easyslip.app

Impersonation

IMPERSONATION_COOKIE_VALUE <openssl rand -hex 16>

---

3. ปรับ ENV ที่มีอยู่แล้ว  


┌─────────────────────┬───────────────────────┬──────────────────────────────────┐
│ Variable │ ค่าเดิม │ ค่าที่ต้องแก้ │  
 ├─────────────────────┼───────────────────────┼──────────────────────────────────┤  
 │ AUTH_URL │ http://localhost:3000 │ https://easyslip.app │  
 ├─────────────────────┼───────────────────────┼──────────────────────────────────┤  
 │ AUTH_TRUST_HOST │ — │ true │  
 ├─────────────────────┼───────────────────────┼──────────────────────────────────┤
│ NEXT_PUBLIC_APP_URL │ http://localhost:3000 │ https://easyslip.app │  
 ├─────────────────────┼───────────────────────┼──────────────────────────────────┤  
 │ EMAIL_FROM │ onboarding@resend.dev │ EasySlip <no-reply@easyslip.app> │
└─────────────────────┴───────────────────────┴──────────────────────────────────┘

---

4. Resend — Verified Domain  


Resend free tier ส่งได้แค่ owner email เท่านั้น ต้อง verify easyslip.app ที่ resend.com/domains แล้วเพิ่ม DNS records ที่ registrar

---

5. vercel.json — Cron ใหม่  


มีแล้วในโค้ด (ถูก push ไปแล้ว):
{ "path": "/api/platform/cron/trial-expiry", "schedule": "5 0 \* \* \*" }  
 Cron นี้จะ expire trial tenants ที่หมดอายุตอนเที่ยงคืน

---

6. One-time Setup หลัง Deploy ครั้งแรก  


ขั้นตอนนี้ทำ manual ผ่าน terminal หลัง ENV set แล้ว:

# 1. Run control-plane migration

CONTROL_PLANE_DATABASE_URL="..." bunx prisma migrate deploy \  
 --schema=prisma/control-plane/schema.prisma

# 2. Seed superadmin account

CONTROL_PLANE_DATABASE_URL="..." bun run scripts/seed-platform-admin.ts

---

สรุป Priority

🔴 Critical (app พัง ถ้าไม่ทำ)
ROOT_DOMAIN=easyslip.app  
 CONTROL_PLANE_DATABASE_URL + DIRECT_URL + ENCRYPTION_KEY  
 Wildcard domain \*.easyslip.app บน Vercel

🟡 Required (feature ใช้ไม่ได้)  
 PLATFORM_SESSION_SECRET  
 PLATFORM_ADMIN_EMAIL / PASSWORD  
 IMPERSONATION_COOKIE_VALUE  
 AUTH_URL / AUTH_TRUST_HOST

🟢 Nice-to-have  
 SIGNUP_NOTIFICATION_EMAIL
Resend domain verify  
 TRIAL_DURATION_DAYS
