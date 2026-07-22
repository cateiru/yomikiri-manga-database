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
  // トップページは force-dynamic のため Next.js の既定値は
  // `private, no-cache, no-store, max-age=0, must-revalidate` になるが、
  // CDN/ブラウザでキャッシュしつつ毎回再検証させたいので明示的に上書きする
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
