import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getOneshotsCount } from "@/lib/oneshots";
import "./globals.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "読み切り漫画データベース",
  description: "各漫画配信サービスの読み切り漫画を横断的に一覧できるサービス",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const oneshotsCount = await getOneshotsCount();

  return (
    <html lang="ja">
      <body>
        <Header oneshotsCount={oneshotsCount} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
