import { describe, expect, it, vi } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { flowercomicsParser } from "./index.js";

const source: Source = {
  key: "flowercomics",
  name: "フラコミlike!",
  listUrls: ["https://flowercomics.jp/rensai/one-shot"],
  siteUrl: "https://flowercomics.jp/",
  parser: "flowercomics",
  enabled: true,
  favicon: "/favicons/flowercomics.png",
};

describe("flowercomics/parse", () => {
  it("フィクスチャから作品ページ URL を重複なく抽出できる", () => {
    const html = loadFixture("flowercomics-oneshot");
    const items = flowercomicsParser.parse(html, source);

    expect(items).toEqual([
      { viewerUrl: "https://flowercomics.jp/title/90001" },
      { viewerUrl: "https://flowercomics.jp/title/90002" },
    ]);
  });
});

describe("flowercomics/collectUrls", () => {
  it("一覧から作品ページを収集し、各作品の priority が最小の話を採用する", async () => {
    const pages: Record<string, string> = {
      "https://flowercomics.jp/rensai/one-shot": loadFixture("flowercomics-oneshot"),
      "https://flowercomics.jp/title/90001": loadFixture("flowercomics-title"),
      // 後日複数パートに分割された読み切り（priority 降順で並ぶ）でも
      // priority が最小の話（最初のパート）を採用することを確認する
      "https://flowercomics.jp/title/90002": loadFixture("flowercomics-title-multi"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await flowercomicsParser.collectUrls?.(source, { fetchAllowedHtml });

    expect(items).toEqual([
      { viewerUrl: "https://flowercomics.jp/chapter/90001" },
      { viewerUrl: "https://flowercomics.jp/chapter/90101" },
    ]);
    // 一覧ページ1件 + 作品ページ2件
    expect(fetchAllowedHtml).toHaveBeenCalledTimes(3);
  });

  it("1作品の取得失敗が他作品の収集を止めない", async () => {
    const pages: Record<string, string> = {
      "https://flowercomics.jp/rensai/one-shot": loadFixture("flowercomics-oneshot"),
      "https://flowercomics.jp/title/90001": loadFixture("flowercomics-title"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      if (url === "https://flowercomics.jp/title/90002") {
        throw new Error("network error");
      }
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await flowercomicsParser.collectUrls?.(source, { fetchAllowedHtml });

    expect(items).toEqual([{ viewerUrl: "https://flowercomics.jp/chapter/90001" }]);
  });
});
