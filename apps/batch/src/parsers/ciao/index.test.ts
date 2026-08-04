import { describe, expect, it, vi } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { ciaoParser } from "./index.js";

const source: Source = {
  key: "ciao",
  name: "ちゃおプラス",
  listUrls: ["https://ciao.shogakukan.co.jp/comics/search/keyword/166"],
  siteUrl: "https://ciao.shogakukan.co.jp/",
  parser: "ciao",
  enabled: true,
  favicon: "/favicons/ciao.png",
};

describe("ciao/parse", () => {
  it("静的な一覧 HTML が存在しないため呼ばれた場合は明示的にエラーになる", () => {
    expect(() => ciaoParser.parse("", source)).toThrow();
  });
});

describe("ciao/collectUrls", () => {
  it("headless 経由で取得した一覧を viewerUrl（5桁ゼロ埋め）に変換する", async () => {
    const searchResponse = JSON.parse(loadFixture("ciao-search-title", "json"));
    const fetchAllowedViaHeadless = vi.fn(
      async (url: string, matchResponse: (u: string) => boolean) => {
        expect(url).toBe("https://ciao.shogakukan.co.jp/comics/search/keyword/166");
        expect(matchResponse("https://api.ciao.shogakukan.co.jp/search/title?tag_id=166")).toBe(
          true,
        );
        expect(matchResponse("https://ciao.shogakukan.co.jp/comics/_nuxt/entry.js")).toBe(false);
        return searchResponse;
      },
    );

    const items = await ciaoParser.collectUrls?.(source, {
      fetchAllowedHtml: vi.fn(),
      fetchAllowedViaHeadless,
    });

    expect(items).toEqual([
      { viewerUrl: "https://ciao.shogakukan.co.jp/comics/title/00286/episode/07309" },
      { viewerUrl: "https://ciao.shogakukan.co.jp/comics/title/00289/episode/07310" },
    ]);
    expect(fetchAllowedViaHeadless).toHaveBeenCalledTimes(1);
  });

  it("fetchAllowedViaHeadless が渡されない deps では明示的にエラーになる", async () => {
    await expect(ciaoParser.collectUrls?.(source, { fetchAllowedHtml: vi.fn() })).rejects.toThrow();
  });
});
