import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./magcomi.js";

const source: Source = {
  key: "magcomi",
  name: "マグコミ",
  listUrl: "https://magcomi.com/series/oneshot",
  parser: "gigaviewer",
  enabled: true,
};

describe("gigaviewer/magcomi", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("magcomi"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.author).not.toBeNull();
      expect(item.viewerUrl).toMatch(/^https:\/\/magcomi\.com\/episode\/\d+$/);
      expect(item.thumbnailUrl).toMatch(/^https:\/\//);
    }
  });
});
