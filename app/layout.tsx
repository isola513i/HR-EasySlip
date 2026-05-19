import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/shared/sw-registrar";
import { ViewTransitions } from "@/components/shared/view-transitions";
import { Toaster } from "@/components/ui/sonner";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LocaleProvider } from "@/lib/i18n/locale-context";

const notoSansThai = localFont({
  src: "../public/NotoSansThai.ttf",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return {
    title: {
      default: "EasySlip HR",
      template: "%s · EasySlip HR",
    },
    description: t.metadata.description,
    icons: {
      icon: [
        { url: "/favicons/favicon.ico", sizes: "any" },
        {
          url: "/favicons/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png",
        },
        {
          url: "/favicons/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
      ],
      apple: { url: "/favicons/apple-touch-icon.png", sizes: "180x180" },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "EasySlip HR",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  const t = getDictionary(locale)

  return (
    <html lang={locale} className={`${notoSansThai.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg focus-visible:translate-y-0 transition-transform duration-150 focus-visible:outline-none"
        >
          {t.metadata.skipToContent}
        </a>
        <LocaleProvider locale={locale}>
          {children}
        </LocaleProvider>
        <Toaster position="bottom-center" />
        <ServiceWorkerRegistrar />
        <ViewTransitions />
      </body>
    </html>
  );
}
