export interface InboxProvider {
  name: string;
  url: string;
}

const PROVIDERS: Record<string, InboxProvider> = {
  "gmail.com": {
    name: "Gmail",
    url: "https://mail.google.com/mail/u/0/#inbox",
  },
  "googlemail.com": {
    name: "Gmail",
    url: "https://mail.google.com/mail/u/0/#inbox",
  },
  "outlook.com": {
    name: "Outlook",
    url: "https://outlook.live.com/mail/0/inbox",
  },
  "hotmail.com": {
    name: "Outlook",
    url: "https://outlook.live.com/mail/0/inbox",
  },
  "live.com": {
    name: "Outlook",
    url: "https://outlook.live.com/mail/0/inbox",
  },
  "msn.com": {
    name: "Outlook",
    url: "https://outlook.live.com/mail/0/inbox",
  },
  "yahoo.com": { name: "Yahoo Mail", url: "https://mail.yahoo.com" },
  "icloud.com": { name: "iCloud Mail", url: "https://www.icloud.com/mail" },
  "me.com": { name: "iCloud Mail", url: "https://www.icloud.com/mail" },
  "mac.com": { name: "iCloud Mail", url: "https://www.icloud.com/mail" },
  "proton.me": { name: "Proton Mail", url: "https://mail.proton.me" },
  "protonmail.com": { name: "Proton Mail", url: "https://mail.proton.me" },
};

export function getInboxProvider(email: string): InboxProvider | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return PROVIDERS[domain] ?? null;
}
