import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./magcomi.js";

const source: Source = {
  key: "magcomi",
  name: "マグコミ",
  listUrls: ["https://magcomi.com/series/oneshot"],
  siteUrl: "https://magcomi.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/magcomi.png",
};

describe("gigaviewer/magcomi", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("magcomi"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/magcomi\.com\/episode\/\d+$/);
    }
  });

  it("漫画賞ページから漫画賞作品のみを抽出できる（アンソロジーは含まない）", () => {
    const $ = load(loadFixture("magcomi-award"));
    const items = extract($, source);

    expect(items).toEqual([
      { viewerUrl: "https://magcomi.com/episode/2000000000000000001" },
      { viewerUrl: "https://magcomi.com/episode/2000000000000000002" },
    ]);
  });
});
