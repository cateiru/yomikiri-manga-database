import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "読み切り漫画データベース",
    short_name: "読み切りDB",
    description: "各漫画配信サービスの読み切り漫画を横断的に一覧できるサービス",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2e3142",
    lang: "ja",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
