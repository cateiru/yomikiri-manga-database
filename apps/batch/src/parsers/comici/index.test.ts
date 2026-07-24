import { describe, expect, it, vi } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { comiciParser } from "./index.js";

const source: Source = {
  key: "championcross",
  name: "チャンピオンクロス",
  listUrls: ["https://championcross.jp/category/manga/oneShot/1"],
  siteUrl: "https://championcross.jp/",
  parser: "comici",
  enabled: true,
  favicon: "/favicons/championcross.png",
};

describe("comici/parse", () => {
  it("フィクスチャからシリーズページ URL を抽出できる", () => {
    const html = loadFixture("comici-oneshot");
    const items = comiciParser.parse(html, source);

    expect(items).toEqual([
      { viewerUrl: "https://championcross.jp/series/aaa111" },
      { viewerUrl: "https://championcross.jp/series/bbb222" },
    ]);
  });
});

describe("comici/collectUrls", () => {
  it("一覧をページネーションを辿って収集し、各シリーズの最初の話を採用する", async () => {
    const pages: Record<string, string> = {
      "https://championcross.jp/category/manga/oneShot/1": loadFixture("comici-oneshot"),
      "https://championcross.jp/category/manga/oneShot/2": loadFixture("comici-oneshot-page2"),
      "https://championcross.jp/series/aaa111": loadFixture("comici-series"),
      // 続編が追加され複数話になったシリーズでも第1話を採用することを確認する
      "https://championcross.jp/series/bbb222": loadFixture("comici-series-multi"),
      "https://championcross.jp/series/ccc333": loadFixture("comici-series"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await comiciParser.collectUrls?.(source, { fetchAllowedHtml });

    expect(items).toEqual([
      { viewerUrl: "https://championcross.jp/episodes/xxx111" },
      { viewerUrl: "https://championcross.jp/episodes/multi-ep1" },
      { viewerUrl: "https://championcross.jp/episodes/xxx111" },
    ]);
    // ページ2件 + シリーズ3件
    expect(fetchAllowedHtml).toHaveBeenCalledTimes(5);
  });

  it("1 シリーズの取得失敗が他シリーズの収集を止めない", async () => {
    const pages: Record<string, string> = {
      "https://championcross.jp/category/manga/oneShot/1": loadFixture("comici-oneshot"),
      "https://championcross.jp/category/manga/oneShot/2": loadFixture("comici-oneshot-page2"),
      "https://championcross.jp/series/aaa111": loadFixture("comici-series"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      if (url === "https://championcross.jp/series/bbb222") {
        throw new Error("network error");
      }
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await comiciParser.collectUrls?.(source, { fetchAllowedHtml });

    expect(items).toEqual([{ viewerUrl: "https://championcross.jp/episodes/xxx111" }]);
  });
});
