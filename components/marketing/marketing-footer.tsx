import Link from "next/link";
import Image from "next/image";
import { Mail, Phone } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";

function LineIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 5.95 2 10.8c0 2.92 1.57 5.52 4 7.14v3.06l3.09-1.7c.93.26 1.91.4 2.91.4 5.52 0 10-3.95 10-8.8S17.52 2 12 2zm1.07 11.86l-2.57-2.74-5.02 2.74 5.52-5.86 2.63 2.74 4.96-2.74-5.52 5.86z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    Icon: LineIcon,
    href: "https://line.me/R/ti/p/@368zqypd?oat_content=url&ts=09171747",
    label: "LINE",
    bg: "#00B900",
  },
  {
    Icon: FacebookIcon,
    href: "https://www.facebook.com/Easyslip.tech/",
    label: "Facebook",
    bg: "#1877F2",
  },
  {
    Icon: TikTokIcon,
    href: "https://www.tiktok.com/@easyslipofficial",
    label: "TikTok",
    bg: "#010101",
  },
];

export default async function MarketingFooter() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { tagline, productHeader, supportHeader, links, contact, rights } =
    t.marketing.footer;

  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border/40 py-10 px-4 sm:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[2fr_1fr_1fr_1.4fr] lg:gap-12">
          {/* Brand column */}
          <div className="hidden sm:block">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Image
                src="/favicons/android-chrome-192x192.png"
                alt="EasySlip HR"
                width={36}
                height={36}
                className="rounded-xl"
              />
              <span
                className="text-lg font-bold text-foreground tracking-tight"
                translate="no"
              >
                EasySlip HR
              </span>
            </Link>
            <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
              {tagline}
            </p>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ Icon, href, label, bg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{ backgroundColor: bg }}
                  className="flex size-9 items-center justify-center rounded-xl text-white transition-[filter] duration-150 hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <nav aria-label="Product links">
            <p className="text-sm font-semibold text-foreground mb-2 sm:mb-3">
              {productHeader}
            </p>
            <ul className="flex flex-col">
              {[
                { href: "/#features", label: links.features },
                { href: "/#pricing", label: links.pricing },
                { href: "/signup", label: links.startTrial, newTab: true },
                { href: "/signin", label: links.signIn },
              ].map(({ href, label, newTab }) => (
                <li key={href}>
                  <Link
                    href={href}
                    {...(newTab
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="flex min-h-9 items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm sm:min-h-11"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support links */}
          <nav aria-label="Support links">
            <p className="text-sm font-semibold text-foreground mb-2 sm:mb-3">
              {supportHeader}
            </p>
            <ul className="flex flex-col">
              {[
                { href: "/#faq", label: links.faq, newTab: false },
                { href: "/privacy", label: links.privacy, newTab: true },
                { href: "/terms", label: links.terms, newTab: true },
              ].map(({ href, label, newTab }) => (
                <li key={href}>
                  <Link
                    href={href}
                    target={newTab ? "_blank" : undefined}
                    rel={newTab ? "noopener noreferrer" : undefined}
                    className="flex min-h-9 items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm sm:min-h-11"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <p className="text-sm font-semibold text-foreground mb-3 sm:mb-5">
              {links.contactUs}
            </p>
            <ul className="flex flex-col">
              <li>
                <a
                  href="https://line.me/R/ti/p/@368zqypd?oat_content=url&ts=09171747"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-11"
                >
                  <span className="flex size-6 items-center justify-center rounded-md bg-[#00B900] text-white">
                    <LineIcon className="size-3.5" />
                  </span>
                  {contact.line}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex min-h-9 items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-11"
                >
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Mail className="size-3.5" />
                  </span>
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${contact.phone.replace(/-/g, "")}`}
                  className="inline-flex min-h-9 items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-11"
                >
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Phone className="size-3.5" />
                  </span>
                  {contact.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-border/40 pt-5 flex flex-col sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:pt-6 gap-2">
          <p className="text-xs text-muted-foreground">
            © {year} <span translate="no">EasySlip</span> Co., Ltd. {rights}
          </p>
          <p className="text-xs text-muted-foreground" translate="no">
            EasySlip HR · Powered by EasySlip
          </p>
        </div>
      </div>
    </footer>
  );
}
