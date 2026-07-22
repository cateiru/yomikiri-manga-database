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
  // CDN/ブラウザでキャッシュしつつ毎回再検証させたいので明示的に上書きする
  // （s-maxage=60 は CDN 側の共有キャッシュ用。ブラウザは max-age=0 のため毎回再検証する）
  async headers() {
    const publiclyCacheablePaths = ["/", "/about", "/help", "/favorites", "/privacy"];
    return publiclyCacheablePaths.map((source) => ({
      source,
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, s-maxage=60, must-revalidate",
        },
      ],
    }));
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
