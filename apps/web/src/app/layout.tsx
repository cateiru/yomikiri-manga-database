import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DebugBanner } from "@/components/DebugBanner";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Header } from "@/components/Header";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { getOneshotsCount } from "@/lib/oneshots";
import "./globals.css";

export const revalidate = 300;

const title = "読み切り漫画データベース";
const description = "各漫画配信サービスの読み切り漫画を横断的に一覧できるサービス";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2e3142",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://yomikiri-manga.com"),
  title,
  description,
  alternates: {
    types: {
      "application/xml": "/rss.xml",
    },
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: title,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "読み切りDB",
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const oneshotsCount = await getOneshotsCount();

  return (
    <html lang="ja">
      <body>
        <DebugBanner />
        <GoogleAnalytics />
        <ServiceWorkerRegister />
        <Header oneshotsCount={oneshotsCount} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
