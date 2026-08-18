import { describe, expect, it, vi } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { comicFuzParser } from "./index.js";

const source: Source = {
  key: "comic-fuz",
  name: "COMIC FUZ",
  listUrls: ["https://comic-fuz.com/manga/tag/17"],
  siteUrl: "https://comic-fuz.com/",
  parser: "comic-fuz",
  enabled: true,
  favicon: "/favicons/comic-fuz.png",
};

describe("comic-fuz/parse", () => {
  it("静的な一覧 HTML からは抽出できないため呼ばれた場合は明示的にエラーになる", () => {
    expect(() => comicFuzParser.parse("", source)).toThrow();
  });
});

describe("comic-fuz/collectUrls", () => {
  it("headless 経由で描画した一覧 HTML から viewerUrl を重複排除して抽出する", async () => {
    const html = loadFixture("comic-fuz-tag");
    const fetchAllowedRenderedHtml = vi.fn(async (url: string, waitForSelector: string) => {
      expect(url).toBe(source.listUrls[0]);
      expect(waitForSelector).toBe('a[href^="/manga/"]');
      return html;
    });

    const items = await comicFuzParser.collectUrls?.(source, {
      fetchAllowedHtml: vi.fn(),
      fetchAllowedRenderedHtml,
    });

    expect(items).toEqual([
      { viewerUrl: "https://comic-fuz.com/manga/2193" },
      { viewerUrl: "https://comic-fuz.com/manga/3965" },
    ]);
    expect(fetchAllowedRenderedHtml).toHaveBeenCalledTimes(1);
  });

  it("タグ一覧ページへのリンク（/manga/tag/...）を作品として誤抽出しない", async () => {
    const html = loadFixture("comic-fuz-tag");
    const fetchAllowedRenderedHtml = vi.fn(async () => html);

    const items = await comicFuzParser.collectUrls?.(source, {
      fetchAllowedHtml: vi.fn(),
      fetchAllowedRenderedHtml,
    });

    expect(items).not.toContainEqual({ viewerUrl: "https://comic-fuz.com/manga/tag/13" });
    expect(items).not.toContainEqual({ viewerUrl: "https://comic-fuz.com/manga/tag/17" });
  });

  it("fetchAllowedRenderedHtml が渡されない deps では明示的にエラーになる", async () => {
    await expect(
      comicFuzParser.collectUrls?.(source, { fetchAllowedHtml: vi.fn() }),
    ).rejects.toThrow();
  });
});
