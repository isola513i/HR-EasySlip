export const BRAND = {
  name: "EasySlip HR",
  color: "#18181b",
  accent: "#2563eb",
  bg: "#f4f4f5",
  card: "#ffffff",
  muted: "#71717a",
  border: "#e4e4e7",
  success: "#16a34a",
  successBg: "#f0fdf4",
  error: "#dc2626",
  errorBg: "#fef2f2",
} as const;

export function unsubscribeFooterHtml(appUrl: string): string {
  return `<tr><td align="center" style="padding-top:12px;font-size:10px;color:${BRAND.muted};">
    หากไม่ต้องการรับอีเมลแจ้งเตือน <a href="${appUrl}/employee/me" style="color:${BRAND.accent};text-decoration:underline;">จัดการการแจ้งเตือน</a>
    <br/>To unsubscribe, <a href="${appUrl}/employee/me" style="color:${BRAND.accent};text-decoration:underline;">manage notification preferences</a>
  </td></tr>`;
}

export function unsubscribeFooterText(appUrl: string): string {
  return `\n---\nจัดการการแจ้งเตือน / Manage notifications: ${appUrl}/employee/me`;
}

