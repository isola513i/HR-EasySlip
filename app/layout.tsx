import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/shared/sw-registrar";
import { Toaster } from "@/components/ui/sonner";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

const notoSansThai = localFont({
  src: "../public/fonts/NotoSansThai-Variable.ttf",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
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
    manifest: "/manifest.webmanifest",
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
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body
        className={`${notoSansThai.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-center" />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
