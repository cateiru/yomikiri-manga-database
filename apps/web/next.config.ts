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
};

initOpenNextCloudflareForDev();

export default nextConfig;
