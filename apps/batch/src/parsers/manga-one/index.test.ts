import { describe, expect, it, vi } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { mangaOneParser } from "./index.js";

const source: Source = {
  key: "manga-one",
  name: "マンガワン",
  listUrls: [
    "https://manga-one.com/search/result?tag-id=81&label=%E8%AA%AD%E3%81%BF%E5%88%87%E3%82%8A",
  ],
  siteUrl: "https://manga-one.com/",
  parser: "manga-one",
  enabled: true,
  favicon: "/favicons/manga-one.png",
};

describe("manga-one/parse", () => {
  it("静的な一覧 HTML からは抽出できないため呼ばれた場合は明示的にエラーになる", () => {
    expect(() => mangaOneParser.parse("", source)).toThrow();
  });
});

describe("manga-one/collectUrls", () => {
  it("headless 経由で描画した一覧 HTML から viewerUrl を重複排除して抽出する", async () => {
    const html = loadFixture("manga-one-search");
    const fetchAllowedRenderedHtml = vi.fn(async (url: string, waitForSelector: string) => {
      expect(url).toBe(source.listUrls[0]);
      expect(waitForSelector).toBe('main ul li a[href^="/manga/"]');
      return html;
    });

    const items = await mangaOneParser.collectUrls?.(source, {
      fetchAllowedHtml: vi.fn(),
      fetchAllowedRenderedHtml,
    });

    expect(items).toEqual([
      { viewerUrl: "https://manga-one.com/manga/26639/chapter/283424" },
      { viewerUrl: "https://manga-one.com/manga/28285/chapter/356248" },
      { viewerUrl: "https://manga-one.com/manga/3002/chapter/261353" },
    ]);
    expect(fetchAllowedRenderedHtml).toHaveBeenCalledTimes(1);
  });

  it("「よく検索されている作品」（section 要素で囲われた人気検索ランキング）を除外する", async () => {
    const html = loadFixture("manga-one-search");
    const fetchAllowedRenderedHtml = vi.fn(async () => html);

    const items = await mangaOneParser.collectUrls?.(source, {
      fetchAllowedHtml: vi.fn(),
      fetchAllowedRenderedHtml,
    });

    expect(items).not.toContainEqual({
      viewerUrl: "https://manga-one.com/manga/1020/chapter/357556",
    });
    expect(items).not.toContainEqual({
      viewerUrl: "https://manga-one.com/manga/2245/chapter/356752",
    });
  });

  it("fetchAllowedRenderedHtml が渡されない deps では明示的にエラーになる", async () => {
    await expect(
      mangaOneParser.collectUrls?.(source, { fetchAllowedHtml: vi.fn() }),
    ).rejects.toThrow();
  });
});

describe("manga-one/fetchViewerDetail", () => {
  it("headless 経由で描画したビューワー HTML から詳細を抽出する", async () => {
    const html = loadFixture("manga-one-viewer");
    const viewerUrl = "https://manga-one.com/manga/26349/chapter/274584";
    const fetchAllowedRenderedHtml = vi.fn(async (url: string, waitForSelector: string) => {
      expect(url).toBe(viewerUrl);
      expect(waitForSelector).toBe("header h1");
      return html;
    });

    const detail = await mangaOneParser.fetchViewerDetail?.(viewerUrl, {
      fetchAllowedRenderedHtml,
    });

    expect(detail?.title).toBe("サンプルタイトル");
    expect(fetchAllowedRenderedHtml).toHaveBeenCalledTimes(1);
  });
});
