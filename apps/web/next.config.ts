import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(import.meta.dirname, "../.."),
  },
  // @yomikiri/db はビルド済み JS を持たず TS ソースを直接公開しているため、
  // Next.js のコンパイルパイプラインに含めて解決させる
  transpilePackages: ["@yomikiri/db"],
  // 型チェックは各パッケージの `typecheck` スクリプト（tsc --noEmit）で行うため、
  // ビルド内蔵の型チェックは重複を避けるために無効化する。
  typescript: {
    ignoreBuildErrors: true,
  },
  // 以下のページは force-dynamic のため Next.js の既定値は
  // `private, no-cache, no-store, max-age=0, must-revalidate` になるが、
  // いずれもユーザー固有の情報を含まない（お気に入り等は localStorage 管理）ため
  // CDN/ブラウザでキャッシュしつつ毎回再検証させたいので明示的に上書きする。
  // バッチはデータを1日3回（最短6時間間隔）しか更新しないため、s-maxage=1時間 の
  // 鮮度遅延は許容範囲。stale-while-revalidate=1分 により、キャッシュ失効後の
  // 最初のアクセスも（DB アクセスを伴うオリジン再取得を待たず）stale 応答を即返し、
  // 裏で再検証させることでオリジンの応答が遅い場合の体感待ち時間をなくす。
  // ブラウザは max-age=0 のため毎回再検証する
  async headers() {
    const publiclyCacheablePaths = [
      "/",
      "/about",
      "/help",
      "/favorites",
      "/privacy",
      "/rss.xml",
      "/status",
    ];
    return publiclyCacheablePaths.map((source) => ({
      source,
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=60",
        },
      ],
    }));
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
