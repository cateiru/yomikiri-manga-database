import { describe, expect, it, vi } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { mangaUpParser } from "./index.js";

const source: Source = {
  key: "manga-up",
  name: "マンガUP！",
  listUrls: ["https://www.manga-up.com/genres/157"],
  siteUrl: "https://www.manga-up.com/",
  parser: "manga-up",
  enabled: true,
  favicon: "/favicons/manga-up.png",
};

describe("manga-up/parse", () => {
  it("フィクスチャから作品ページ URL を重複排除して抽出できる", () => {
    const html = loadFixture("manga-up-genres");
    const items = mangaUpParser.parse(html, source);

    expect(items).toEqual([
      { viewerUrl: "https://www.manga-up.com/titles/1018" },
      { viewerUrl: "https://www.manga-up.com/titles/1746" },
    ]);
  });
});

describe("manga-up/collectUrls", () => {
  it("ジャンル一覧から作品ページ URL を集め、各作品の最初の話を採用する", async () => {
    const pages: Record<string, string> = {
      "https://www.manga-up.com/genres/157": loadFixture("manga-up-genres"),
      "https://www.manga-up.com/titles/1018": loadFixture("manga-up-title-multi"),
      "https://www.manga-up.com/titles/1746": loadFixture("manga-up-title-single"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await mangaUpParser.collectUrls?.(source, { fetchAllowedHtml });

    // 前編・中編・後編に分かれる作品でも DOM 順で先頭（前編）を採用する
    expect(items).toEqual([
      { viewerUrl: "https://www.manga-up.com/titles/1018/chapters/75505" },
      { viewerUrl: "https://www.manga-up.com/titles/1746/chapters/342273" },
    ]);
    // ジャンル一覧 1 件 + 作品ページ 2 件
    expect(fetchAllowedHtml).toHaveBeenCalledTimes(3);
  });

  it("1 作品の取得失敗が他作品の収集を止めない", async () => {
    const pages: Record<string, string> = {
      "https://www.manga-up.com/genres/157": loadFixture("manga-up-genres"),
      "https://www.manga-up.com/titles/1746": loadFixture("manga-up-title-single"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      if (url === "https://www.manga-up.com/titles/1018") {
        throw new Error("network error");
      }
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await mangaUpParser.collectUrls?.(source, { fetchAllowedHtml });

    expect(items).toEqual([{ viewerUrl: "https://www.manga-up.com/titles/1746/chapters/342273" }]);
  });
});
