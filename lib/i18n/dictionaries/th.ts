import type { Dictionary } from "./en";

const th = {
  common: {
    appName: "EasySlip HR",
    signOut: "ออกจากระบบ",
    greeting: "สวัสดี",
    back: "กลับ",
    sessionDebug: "Session debug",
  },
  metadata: {
    description:
      "ระบบบริหารทรัพยากรบุคคล EasySlip — ลงเวลา ลางาน อนุมัติ",
  },
  signin: {
    pageTitle: "เข้าสู่ระบบ",
    heading: "EasySlip HR",
    subtitle:
      "กรอกอีเมลบริษัทของคุณ ระบบจะส่ง magic link ให้เข้าสู่ระบบ",
    emailLabel: "อีเมล",
    emailPlaceholder: "name@company.co.th",
    submitButton: "ส่ง magic link",
    submitting: "กำลังส่ง...",
    noPassword: "ไม่มีรหัสผ่าน — เข้าผ่านอีเมลเท่านั้น",
    magicLinkSent: "ส่ง magic link ไปที่",
    moreDetails: "ดูรายละเอียดเพิ่มเติม",
    errorTitle: "เข้าสู่ระบบไม่สำเร็จ",
    emailInvalid: "กรุณากรอกอีเมลให้ถูกต้อง",
    emailSendFailed: "ไม่สามารถส่งอีเมลได้",
    rateLimited: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
    invalidData: "ข้อมูลไม่ถูกต้อง",
    errors: {
      AccessDenied:
        "บัญชีของคุณถูกระงับ หรือสถานะพนักงานไม่อยู่ในระบบงานแล้ว (SUSPENDED / RESIGNED / TERMINATED) — กรุณาติดต่อฝ่าย HR",
      Verification:
        "Magic link นี้ใช้งานแล้วหรือหมดอายุ กรุณาขอใหม่อีกครั้ง",
      Configuration:
        "การตั้งค่าระบบผิดพลาด ติดต่อ CTO เพื่อตรวจสอบค่า AUTH_* / RESEND_API_KEY",
      Default: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง",
    },
    errorTitles: {
      AccessDenied: "ไม่สามารถเข้าสู่ระบบได้",
      Verification: "ลิงก์หมดอายุ",
      Configuration: "การตั้งค่าระบบผิดพลาด",
      Default: "เกิดข้อผิดพลาด",
    },
  },
  checkEmail: {
    pageTitle: "ตรวจสอบอีเมลของคุณ",
    heading: "ตรวจสอบอีเมลของคุณ",
    instruction:
      "เราส่ง magic link ไปยังอีเมลที่คุณกรอกแล้ว กดลิงก์ในอีเมลเพื่อเข้าสู่ระบบ ลิงก์จะหมดอายุภายใน 24 ชั่วโมง",
    notFound: "ไม่พบอีเมล?",
    checkSpam: "ตรวจสอบในกล่องจดหมายขยะ / Spam",
    waitMoment: "รอสักครู่ — บางครั้งอาจใช้เวลา 1–2 นาที",
    tryAgain: "ลองส่งใหม่อีกครั้ง",
    backToSignIn: "กลับไปหน้า sign in",
  },
  employee: {
    todayTitle: "วันนี้",
    notClockedIn:
      "ยังไม่ได้ลงเวลาเข้างาน (stub — จะ build จริง Day 3+)",
  },
  hr: {
    overviewTitle: "HR Overview",
  },
  manager: {
    inboxTitle: "Manager Inbox",
    noPending:
      "ยังไม่มีคำขอรออนุมัติ (stub page — จะ build จริง Day 3+)",
  },
  errors: {
    forbidden: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
    unauthorized: "กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ",
  },
} as const satisfies Dictionary;

export default th;
