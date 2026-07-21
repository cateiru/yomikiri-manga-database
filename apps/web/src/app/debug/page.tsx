import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DebugPanel } from "@/components/DebugPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "デバッグ | 読み切り漫画データベース",
  robots: { index: false, follow: false },
};

export default function DebugPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DebugPanel />;
}
