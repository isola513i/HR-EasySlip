// ════════════════════════════════════════════════════════════════
// Seed: SystemConfig (editable by HRMG via Org Settings UI)
// ────────────────────────────────────────────────────────────────
// Values stored as Json — can be string, number, or object.
// Keys follow `domain.category.name` namespacing.
// ════════════════════════════════════════════════════════════════

import type { PrismaClient } from '@prisma/client';

type ConfigEntry = {
  key: string;
  value: unknown;
  description: string;
};

const DEFAULTS: ConfigEntry[] = [
  // ─── Leave: half-day windows ───
  { key: 'leave.halfday.morning_start', value: '09:00', description: 'เวลาเริ่มครึ่งเช้า (HH:mm)' },
  { key: 'leave.halfday.morning_end', value: '13:00', description: 'เวลาสิ้นสุดครึ่งเช้า' },
  { key: 'leave.halfday.afternoon_start', value: '13:00', description: 'เวลาเริ่มครึ่งบ่าย' },
  { key: 'leave.halfday.afternoon_end', value: '18:00', description: 'เวลาสิ้นสุดครึ่งบ่าย' },

  // ─── Leave: quota limits ───
  { key: 'leave.sick.max_paid_days', value: 30, description: 'วันลาป่วยสูงสุดที่ได้ค่าจ้าง (Thai Labor 2025)' },
  { key: 'leave.personal.max_days', value: 3, description: 'วันลากิจธุระจำเป็นสูงสุด/ปี (Thai Labor 2025)' },
  { key: 'leave.annual.full_year_days', value: 6, description: 'สิทธิ์ลาพักร้อนเต็มปี หลังครบ 1 ปี' },
  { key: 'leave.annual.rounding_step', value: 0.5, description: 'Step สำหรับ round-down (ครึ่งวัน)' },
  { key: 'leave.annual.days_in_year_basis', value: 365, description: 'จำนวนวันฐานสำหรับ prorate' },
  { key: 'leave.maternity.days', value: 120, description: 'วันลาคลอด (รวมก่อน/หลังคลอด ตาม พ.ร.บ.คุ้มครองแรงงาน)' },

  // ─── Payroll: cut-off ───
  { key: 'payroll.cutoff.day_of_month', value: 25, description: 'วันปิดรอบ (ล็อก record)' },

  // ─── Overtime caps (Thai Labor Protection Act) ───
  { key: 'overtime.daily_cap_hours', value: 4, description: 'เพดาน OT ต่อวัน (พ.ร.บ.คุ้มครองแรงงาน)' },
  { key: 'overtime.weekly_cap_hours', value: 36, description: 'เพดาน OT ต่อสัปดาห์ (พ.ร.บ.คุ้มครองแรงงาน)' },

  // ─── Attendance: policy ───
  { key: 'attendance.late_threshold_minutes', value: 15, description: 'เวลาสาย (นาที) ที่จะ flag' },
  { key: 'attendance.gps.capture_enabled', value: true, description: 'เก็บ GPS ตอน clock in/out (log only)' },

  // ─── Geofence (soft-warning only per Phase 1 spec) ───
  // Office: บริษัท ธันเดอร์ โซลูชั่น จำกัด (จ.ขอนแก่น)
  // Phase 1 has many WFH employees — breach panel will see frequent
  // "outside" entries by design; HR uses it as a daily roll-up rather
  // than an alert.
  { key: 'attendance.gps.enforce_geofence', value: true, description: 'เปิดเตือนเมื่อ clock-in นอกพื้นที่ (log-only ไม่บล็อก)' },
  { key: 'attendance.geofence.center_lat', value: 16.4431033, description: 'Latitude จุดศูนย์กลางออฟฟิศ (Thunder Solution)' },
  { key: 'attendance.geofence.center_lng', value: 102.7992255, description: 'Longitude จุดศูนย์กลางออฟฟิศ (Thunder Solution)' },
  { key: 'attendance.geofence.radius_meters', value: 500, description: 'รัศมี geofence (เมตร)' },

  // ─── PDPA ───
  { key: 'pdpa.consent.current_version', value: '1.0', description: 'Version ปัจจุบันของ PDPA consent (bump เพื่อบังคับให้ทุกคน re-consent)' },
  { key: 'pdpa.audit_log.retention_days', value: 90, description: 'Audit log retention (ข้อมูลย้อนหลัง)' },
];

export async function seedSystemConfig(
  prisma: PrismaClient,
  updatedByUserId: string,
): Promise<void> {
  for (const entry of DEFAULTS) {
    await prisma.systemConfig.upsert({
      where: { key: entry.key },
      create: {
        key: entry.key,
        value: entry.value as never,
        description: entry.description,
        updatedBy: updatedByUserId,
      },
      update: {
        value: entry.value as never,
        description: entry.description,
        updatedBy: updatedByUserId,
      },
    });
  }
}
