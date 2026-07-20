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
  // TypeScript 7 は `typescript` パッケージの API 構成が刷新されており、
  // Next.js のビルド内蔵型チェックと非互換なため無効化する。
  // 型チェックは各パッケージの `typecheck` スクリプト（tsc --noEmit）で行う。
  typescript: {
    ignoreBuildErrors: true,
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
