import Image from "next/image";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { AuthMarketing } from "@/components/shared/auth-marketing";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  heading: string;
  subtitle: string;
  marketingHeading?: string;
  marketingTagline?: string;
  marketingSlot?: React.ReactNode;
  copyright: string;
  privacyPolicy: string;
  platformAdminLink?: string;
  hidePlatformLink?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}

export function AuthLayout({
  heading,
  subtitle,
  marketingHeading,
  marketingTagline,
  marketingSlot,
  copyright,
  privacyPolicy,
  platformAdminLink = "Platform Admin",
  hidePlatformLink = false,
  wide = false,
  children,
}: AuthLayoutProps) {
  const copyrightText = copyright.replace(
    "{year}",
    String(new Date().getFullYear()),
  );

  return (
    <main id="main-content" className="relative flex min-h-dvh flex-col lg:flex-row">
      <div className="relative flex flex-1 flex-col bg-background pl-12 pr-12 pb-8 pt-9">
        <header className="flex h-[72px] items-center justify-between">
          <Image
            src="/easyslip-logo.png"
            alt="EasySlip"
            width={121}
            height={32}
            priority
          />
          <div className="lg:hidden">
            <LocaleSwitcher />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center pb-12 pt-6">
          <div
            className={cn(
              "w-full space-y-8",
              wide ? "max-w-2xl" : "max-w-md",
            )}
          >
            <div className="space-y-3 text-center">
              <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
                {heading}
              </h1>
              <p className="text-base text-muted-foreground">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>

        <footer className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>{copyrightText}</p>
          <div className="flex items-center gap-4">
            {!hidePlatformLink && (
              <a
                href="/platform/signin"
                className="opacity-30 transition-opacity hover:opacity-60"
              >
                {platformAdminLink}
              </a>
            )}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[2.75rem] items-center opacity-70 transition-opacity hover:text-foreground hover:opacity-100"
            >
              {privacyPolicy}
            </a>
          </div>
        </footer>
      </div>

      {marketingSlot ?? (marketingHeading && marketingTagline ? (
        <AuthMarketing heading={marketingHeading} tagline={marketingTagline} />
      ) : null)}
    </main>
  );
}
