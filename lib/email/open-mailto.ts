export function openMailto(emails: string | string[]): boolean {
  const list = Array.isArray(emails) ? emails.filter(Boolean) : [emails].filter(Boolean);
  if (list.length === 0) return false;
  window.location.href = `mailto:${list.join(",")}`;
  return true;
}
