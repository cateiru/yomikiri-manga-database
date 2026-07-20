import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./comic-days.js";

const source: Source = {
  key: "comic-days",
  name: "コミックDAYS",
  listUrl: "https://comic-days.com/oneshot",
  parser: "gigaviewer",
  enabled: true,
};

describe("gigaviewer/comic-days", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("comic-days"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-days\.com\/episode\/\d+$/);
      expect(item.thumbnailUrl).toMatch(/^https:\/\//);
    }
    expect(items[0]?.author).not.toBeNull();
    expect(items[0]?.publishedAt).toBeInstanceOf(Date);
  });
});
