// ════════════════════════════════════════════════════════════════
// Seed: Thai Public Holidays 2026
// ────────────────────────────────────────────────────────────────
// Source: Bank of Thailand / MOL official calendar 2026 (B.E. 2569)
// NOTE: HRMG can edit via Org Settings UI later.
//
// Dates may need manual confirmation against:
//   https://www.bot.or.th/th/financial-institutions-holidays.html
// ════════════════════════════════════════════════════════════════

import type { PrismaClient } from '@prisma/client';

type Holiday = {
  date: string; // ISO YYYY-MM-DD
  name: string;
  nameEn: string;
  isSubstituted?: boolean;
};

const HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: 'วันขึ้นปีใหม่', nameEn: "New Year's Day" },
  { date: '2026-01-02', name: 'วันหยุดชดเชยปีใหม่', nameEn: 'New Year Substitute', isSubstituted: true },
  { date: '2026-02-27', name: 'วันมาฆบูชา', nameEn: 'Makha Bucha Day' },
  { date: '2026-04-06', name: 'วันจักรี', nameEn: 'Chakri Memorial Day' },
  { date: '2026-04-13', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2026-04-14', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2026-04-15', name: 'วันสงกรานต์', nameEn: 'Songkran Festival' },
  { date: '2026-05-01', name: 'วันแรงงานแห่งชาติ', nameEn: 'Labour Day' },
  { date: '2026-05-04', name: 'วันฉัตรมงคล', nameEn: 'Coronation Day' },
  { date: '2026-05-26', name: 'วันวิสาขบูชา', nameEn: 'Visakha Bucha Day' },
  { date: '2026-06-03', name: 'วันเฉลิมฯ พระราชินี', nameEn: "Queen's Birthday" },
  { date: '2026-07-28', name: 'วันเฉลิมฯ รัชกาลที่ 10', nameEn: "King's Birthday" },
  { date: '2026-07-29', name: 'วันอาสาฬหบูชา', nameEn: 'Asanha Bucha Day' },
  { date: '2026-07-30', name: 'วันเข้าพรรษา', nameEn: 'Buddhist Lent Day' },
  { date: '2026-08-12', name: 'วันแม่แห่งชาติ', nameEn: "Mother's Day" },
  { date: '2026-10-13', name: 'วันคล้ายวันสวรรคต รัชกาลที่ 9', nameEn: 'King Bhumibol Memorial Day' },
  { date: '2026-10-23', name: 'วันปิยมหาราช', nameEn: 'Chulalongkorn Day' },
  { date: '2026-12-05', name: 'วันพ่อแห่งชาติ', nameEn: "Father's Day" },
  { date: '2026-12-07', name: 'วันหยุดชดเชยวันพ่อ', nameEn: "Father's Day Substitute", isSubstituted: true },
  { date: '2026-12-10', name: 'วันรัฐธรรมนูญ', nameEn: 'Constitution Day' },
  { date: '2026-12-31', name: 'วันสิ้นปี', nameEn: "New Year's Eve" },
];

export async function seedPublicHolidays(
  prisma: PrismaClient,
  createdByUserId: string,
): Promise<void> {
  for (const h of HOLIDAYS_2026) {
    const date = new Date(h.date);
    await prisma.publicHoliday.upsert({
      where: { date },
      create: {
        year: date.getUTCFullYear(),
        date,
        name: h.name,
        nameEn: h.nameEn,
        isSubstituted: h.isSubstituted ?? false,
        createdBy: createdByUserId,
      },
      update: {
        name: h.name,
        nameEn: h.nameEn,
        isSubstituted: h.isSubstituted ?? false,
      },
    });
  }
}
